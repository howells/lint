import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import process from "node:process";

import { checkNativeBundle, sha256 } from "../bin/native-integrity.mjs";

export const verifyNativePackage = async ({
  t,
  packageRoot: packagePath,
  fixtureRoot: consumerRoot,
  tarball,
}) => {
  const packageRoot = realpathSync(packagePath);
  const fixtureRoot = join(consumerRoot, "native-smoke");
  mkdirSync(fixtureRoot);
  const { manifest, build } = checkNativeBundle(packageRoot);
  const target = `${process.platform}-${process.arch}`;
  const binary = join(
    packageRoot,
    "vendor/tsgolint",
    manifest.targets[target].path
  );
  const require = createRequire(join(packageRoot, "package.json"));
  const stockPackage = require.resolve("oxlint-tsgolint/package.json");
  const stock = createRequire(stockPackage).resolve(
    `@oxlint-tsgolint/${target}/tsgolint${process.platform === "win32" ? ".exe" : ""}`
  );
  const emptyPath = join(fixtureRoot, "no-runtime-tools");
  mkdirSync(emptyPath);
  // Windows treats environment names case-insensitively; do not leave a Path
  // entry beside PATH and accidentally give child processes the original path.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !["PATH", "OXLINT_TSGOLINT_PATH"].includes(key.toUpperCase())
    )
  );
  env.PATH = emptyPath;
  const records = [];
  const invoke = (name, args, override) => {
    const childEnv = { ...env };
    if (override !== undefined) childEnv.OXLINT_TSGOLINT_PATH = override;
    const result = spawnSync(
      process.execPath,
      [join(packageRoot, "bin", name), ...args],
      {
        cwd: fixtureRoot,
        env: childEnv,
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
      }
    );
    assert.ifError(result.error);
    records.push({
      name,
      args,
      override,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    return result;
  };
  const write = (name, source) =>
    writeFileSync(join(fixtureRoot, name), source);
  write(
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        target: "ES2023",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        types: ["node"],
        typeRoots: [join(consumerRoot, "node_modules/@types")],
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["native-*.mts"],
    })
  );
  write(
    "native-strict.json",
    JSON.stringify({
      categories: { correctness: "off" },
      plugins: ["typescript"],
      options: { typeAware: true },
      rules: {
        "typescript/strict-void-return": "error",
        "typescript/no-unnecessary-type-arguments": "error",
      },
    })
  );
  write(
    "native-core.config.mts",
    'import core from "@howells/lint/oxlint/core";\nexport default { extends: [core] };\n'
  );
  const imports =
    'import { execFile } from "node:child_process";\nimport { promisify } from "node:util";\n\n';
  write(
    "native-inferred.mts",
    `${imports}export const run = promisify(execFile);\n`
  );
  write(
    "native-explicit.mts",
    `${imports}export const run = promisify<typeof execFile.__promisify__>(execFile);\n`
  );
  write(
    "native-generic.mts",
    'declare function select<T>(value: { custom: T }): T;\ndeclare function select(value: () => void): void;\nconst tagged = Object.assign(() => 1, { custom: "text" });\nexport const selected = select(tagged);\n'
  );
  write(
    "native-controls.mts",
    `import { execFile } from "node:child_process";
declare const expectVoid: (callback: () => void) => void;
declare const expectFileVoid: (callback: (file: string) => void) => void;
declare function overloaded(callback: () => void): void;
declare function overloaded(callback: () => any): void;
const returnValue = () => 42;
expectVoid(returnValue);
expectVoid(() => 42);
expectVoid(async () => {});
export const assigned: () => void = returnValue;
expectFileVoid(execFile);
overloaded(() => 42);
`
  );
  const lint = (file, override, config = "native-strict.json") =>
    invoke(
      "howells-oxlint.mjs",
      [
        "--config",
        config,
        "--tsconfig",
        "tsconfig.json",
        "--deny-warnings",
        "--format",
        "json",
        file,
      ],
      override
    );
  const diagnostics = (result) => JSON.parse(result.stdout).diagnostics;
  const strict = "typescript(strict-void-return)";

  await t.test(
    "packed native inputs, all six hashes, provenance and executable modes are intact",
    () => {
      assert.deepEqual(Object.keys(manifest.targets).sort(), [
        "darwin-arm64",
        "darwin-x64",
        "linux-arm64",
        "linux-x64",
        "win32-arm64",
        "win32-x64",
      ]);
      assert.equal(build.nativeTests.passedPackages, 64);
    }
  );
  await t.test(
    "packed default accepts canonical inferred and explicit promisify under strict and full core policy with an empty tool PATH",
    () => {
      for (const file of ["native-inferred.mts", "native-explicit.mts"]) {
        for (const config of ["native-strict.json", "native-core.config.mts"]) {
          const result = lint(file, undefined, config);
          assert.equal(result.status, 0, result.stdout + result.stderr);
          assert.deepEqual(diagnostics(result), []);
        }
      }
      const result = lint("native-generic.mts");
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(diagnostics(result), []);
    }
  );
  await t.test(
    "nonempty upstream override has precedence and reproduces the original native error",
    () => {
      const result = lint("native-inferred.mts", stock);
      assert.equal(result.status, 1, result.stderr);
      assert.deepEqual(
        diagnostics(result).map(({ code }) => code),
        [strict]
      );
    }
  );
  await t.test("empty override selects the corrected bundled backend", () => {
    const result = lint("native-inferred.mts", "");
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(diagnostics(result), []);
  });
  await t.test(
    "value, async, assignment, real execFile and void/any callback controls retain identical diagnostics",
    () => {
      const result = lint("native-controls.mts");
      const original = lint("native-controls.mts", stock);
      assert.equal(result.status, 1, result.stderr);
      assert.equal(original.status, 1, original.stderr);
      assert.deepEqual(
        diagnostics(result).map(({ code }) => code),
        Array(6).fill(strict)
      );
      assert.deepEqual(diagnostics(result), diagnostics(original));
    }
  );
  await t.test(
    "broken explicit override fails without selecting the bundle",
    () => {
      const missing = join(fixtureRoot, "explicit-backend-does-not-exist");
      const result = lint("native-inferred.mts", missing);
      assert.notEqual(result.status, 0);
      assert.match(
        result.stdout + result.stderr,
        /explicit-backend-does-not-exist/u
      );
    }
  );
  await t.test(
    "missing bundled executable fails without stock fallback",
    () => {
      renameSync(binary, `${binary}.held`);
      try {
        const result = lint("native-inferred.mts");
        assert.notEqual(result.status, 0);
        assert.match(result.stdout + result.stderr, /ENOENT|no such file/iu);
        const original = lint("native-inferred.mts", stock);
        assert.equal(original.status, 1);
        assert.deepEqual(
          diagnostics(original).map(({ code }) => code),
          [strict]
        );
      } finally {
        renameSync(`${binary}.held`, binary);
      }
    }
  );
  await t.test(
    "missing native manifest fails honestly and leaves Oxfmt working",
    () => {
      const manifestPath = join(packageRoot, "vendor/tsgolint/manifest.json");
      renameSync(manifestPath, `${manifestPath}.held`);
      try {
        const result = lint("native-inferred.mts");
        assert.notEqual(result.status, 0);
        assert.match(result.stdout + result.stderr, /manifest\.json/u);
        const formatter = invoke(
          "howells-oxfmt.mjs",
          ["--version"],
          "broken-override"
        );
        assert.equal(formatter.status, 0, formatter.stderr);
        assert.match(formatter.stdout, /0\.71\.0/u);
      } finally {
        renameSync(`${manifestPath}.held`, manifestPath);
      }
    }
  );
  if (process.env.HOWELLS_LINT_NATIVE_EVIDENCE) {
    writeFileSync(
      process.env.HOWELLS_LINT_NATIVE_EVIDENCE,
      `${JSON.stringify(
        {
          target,
          node: process.version,
          tarballSha256: sha256(readFileSync(tarball)),
          nativeSha256: manifest.targets[target].sha256,
          build,
          runtimeToolPath: emptyPath,
          records,
        },
        null,
        2
      )}\n`
    );
  }
};
