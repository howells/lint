import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { verifyNativePackage } from "./native-engine-fixture.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

// pnpm's .cmd launcher cannot be execFile'd on Windows. pnpm test supplies its
// Node entrypoint, so matrix jobs use exactly the same manager as the scripts.
const execPnpm = (args, options) => {
  const entrypoint = process.env.npm_execpath;
  if (entrypoint && /pnpm\.(?:[cm]?js)$/u.test(entrypoint)) {
    return execFileAsync(process.execPath, [entrypoint, ...args], options);
  }
  assert.notEqual(
    process.platform,
    "win32",
    "Run this test with pnpm test on Windows."
  );
  return execFileAsync("pnpm", args, options);
};

test("packed package installs without ESLint or TypeScript and loads the Next, Playwright, shadcn, GDP and boundary presets", async (t) => {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "howells-lint-consumer-"))
  );

  try {
    // The destination is a fresh directory, so the tarball is whatever lands in
    // it. Reading the name from disk rather than from `pnpm pack --json` keeps
    // the test immune to anything a lifecycle script writes to stdout.
    let filename = process.env.HOWELLS_LINT_TARBALL;
    if (!filename) {
      await execPnpm(["pack", "--pack-destination", root], { cwd: repoRoot });
      const packed = await readdir(root);
      const tarballs = packed.filter((entry) => entry.endsWith(".tgz"));
      assert.equal(tarballs.length, 1, `expected one tarball, got ${tarballs}`);
      filename = path.join(root, tarballs[0]);
    }
    filename = path.resolve(filename);

    await writeFile(
      path.join(root, "package.json"),
      `${JSON.stringify(
        {
          private: true,
          type: "module",
          dependencies: {
            "@howells/lint": `file:${filename}`,
          },
          devDependencies: {
            "@types/node": "24.13.2",
            "undici-types": "7.18.2",
          },
        },
        null,
        2
      )}\n`
    );
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      'export { default } from "@howells/lint/oxlint/next";\n'
    );
    await writeFile(
      path.join(root, "playwright.oxlint.config.mjs"),
      'export { default } from "@howells/lint/oxlint/playwright";\n'
    );
    await writeFile(
      path.join(root, "oxfmt.config.ts"),
      'export { default } from "@howells/lint/oxfmt";\n'
    );
    await writeFile(
      path.join(root, "portrait.ts"),
      "export const portrait = 1;\n"
    );
    await writeFile(
      path.join(root, "portrait.tsx"),
      'export const Portrait = () => <figure className="p-[13px]" />;\n'
    );

    const installResult = await execPnpm(["install", "--ignore-scripts"], {
      cwd: root,
    });

    assert.doesNotMatch(
      `${installResult.stdout}${installResult.stderr}`,
      /Issues with peer dependencies|unmet peer/i
    );

    // Oxlint is the only engine. A dependency that declares ESLint as a
    // required peer would have pnpm install it here anyway.
    const installedPackages = await readdir(
      path.join(root, "node_modules", ".pnpm")
    );
    assert.deepEqual(
      installedPackages.filter(
        (entry) =>
          entry.startsWith("eslint@") || entry.startsWith("typescript@")
      ),
      []
    );

    const packageJson = JSON.parse(
      await readFile(
        path.join(root, "node_modules", "@howells", "lint", "package.json"),
        "utf8"
      )
    );
    const sourcePackage = JSON.parse(
      await readFile(path.join(repoRoot, "package.json"), "utf8")
    );
    for (const key of [
      "version",
      "bin",
      "exports",
      "dependencies",
      "engines",
    ]) {
      assert.deepEqual(
        packageJson[key],
        sourcePackage[key],
        `packed ${key} changed`
      );
    }
    const oxlintBin = path.join(
      root,
      "node_modules",
      "@howells",
      "lint",
      packageJson.bin["howells-oxlint"]
    );
    const oxfmtBin = path.join(
      root,
      "node_modules",
      "@howells",
      "lint",
      packageJson.bin["howells-oxfmt"]
    );

    const formatResult = await execFileAsync(
      process.execPath,
      [oxfmtBin, "--check", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(
      `${formatResult.stdout}${formatResult.stderr}`,
      /No config found/
    );

    const { stderr } = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "oxlint.config.mjs", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(stderr, /Failed to (load|parse)/);

    // The Playwright rules ship as a vendored file, so this proves it made it
    // into the tarball and loads from there.
    const { stderr: playwrightStderr } = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "playwright.oxlint.config.mjs", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(playwrightStderr, /Failed to (load|parse)/);

    // The shadcn rules are vendored too, and the bundle is ESM inside a
    // CommonJS package, so it only loads if `vendor/shadcn-lint/package.json`
    // reached the tarball alongside it. A finding proves both.
    const shadcnResult = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "oxlint.config.mjs", "portrait.tsx"],
      { cwd: root }
    ).catch((error) => error);

    assert.doesNotMatch(
      `${shadcnResult.stdout}${shadcnResult.stderr}`,
      /Failed to (load|parse)/
    );
    assert.match(
      `${shadcnResult.stdout}${shadcnResult.stderr}`,
      /shadcn\(no-arbitrary-values\)/
    );

    // Only @howells/lint is a direct dependency. The new preset and its pinned
    // plugin must both resolve from the packed package, without a hoisted copy
    // beside the consumer config.
    await writeFile(
      path.join(root, "gdp.oxlint.config.mjs"),
      'import gdp from "@howells/lint/oxlint/gdp";\nexport default { extends: [gdp] };\n'
    );
    await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "gdp.oxlint.config.mjs", "portrait.ts"],
      { cwd: root }
    );
    await writeFile(
      path.join(root, "forged.ts"),
      'import type { Proof } from "@gdp-ts/core";\nexport const forged = {} as Proof<"UserIsProjectAdmin", []>;\n'
    );
    // The normal Next preset must enforce GDP too, without importing the
    // standalone GDP export in the consumer config.
    for (const config of ["gdp.oxlint.config.mjs", "oxlint.config.mjs"]) {
      const gdpResult = await execFileAsync(
        process.execPath,
        [oxlintBin, "--config", config, "forged.ts"],
        { cwd: root }
      ).catch((error) => error);
      assert.equal(gdpResult.code, 1);
      assert.match(
        `${gdpResult.stdout}${gdpResult.stderr}`,
        /gdp-ts\(no-proof-assertion\)/
      );
    }

    // Resolve aliases and the vendored plugin/resolver from an installed
    // tarball, so an accidentally omitted runtime file cannot pass the suite.
    await writeFile(
      path.join(root, "boundaries.oxlint.config.mjs"),
      'import { createNextFeatureBoundaryConfig } from "@howells/lint/oxlint/boundaries";\nexport default { categories: { correctness: "off" }, ...createNextFeatureBoundaryConfig(import.meta.dirname) };\n'
    );
    await writeFile(
      path.join(root, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } })
    );
    for (const layer of ["app", "lib"]) {
      await mkdir(path.join(root, "src", layer), { recursive: true });
      await writeFile(
        path.join(root, "src", layer, "target.ts"),
        "export const value = 1;\n"
      );
    }
    await writeFile(
      path.join(root, "src/app/allowed.ts"),
      'export { value } from "@/lib/target";\n'
    );
    await execFileAsync(
      process.execPath,
      [
        oxlintBin,
        "--config",
        "boundaries.oxlint.config.mjs",
        "src/app/allowed.ts",
      ],
      { cwd: root }
    );
    await writeFile(
      path.join(root, "src/lib/forbidden.ts"),
      'export { value } from "@/app/target";\n'
    );
    const boundaryResult = await execFileAsync(
      process.execPath,
      [
        oxlintBin,
        "--config",
        "boundaries.oxlint.config.mjs",
        "src/lib/forbidden.ts",
      ],
      { cwd: root }
    ).catch((error) => error);
    assert.equal(boundaryResult.code, 1);
    assert.match(
      `${boundaryResult.stdout}${boundaryResult.stderr}`,
      /boundaries\(dependencies\)/
    );

    await verifyNativePackage({
      t,
      packageRoot: path.join(root, "node_modules", "@howells", "lint"),
      fixtureRoot: root,
      tarball: filename,
    });
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
