import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { partitionOxlintArgs } from "../bin/parse-oxlint-args.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const checkBin = path.join(repoRoot, "bin", "howells-check.mjs");
const corePresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "core.mjs")
).href;

// Fixtures live under the repo (so Oxlint resolves Ultracite's bare jsPlugin
// specifiers from the repo's node_modules) but NOT under node_modules, so Node
// type-strips the `.ts` config a real consumer writes. A local package.json
// makes the fixture an ESM package the way a consumer project is.
const fixtureBase = path.join(repoRoot, ".test-fixtures");

async function makeConsumerFixture(srcFiles) {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, "case-"));

  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ type: "module" })
  );
  await writeFile(
    path.join(root, "oxlint.config.ts"),
    `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Bundler",
      },
      include: ["src"],
    })
  );

  for (const [relativePath, source] of Object.entries(srcFiles)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, source);
  }

  return root;
}

async function runCheck(root, args) {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [checkBin, ...args],
      {
        cwd: root,
      }
    );
    return { status: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return {
      status: error.code,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

test("partitionOxlintArgs pairs value-taking flags and collects targets", () => {
  assert.deepEqual(
    partitionOxlintArgs(["--config", "oxlint.config.ts", "src"]),
    {
      options: ["--config", "oxlint.config.ts"],
      targets: ["src"],
    }
  );
  assert.deepEqual(partitionOxlintArgs(["--format=json", "src", "test"]), {
    options: ["--format=json"],
    targets: ["src", "test"],
  });
  assert.deepEqual(partitionOxlintArgs(["-D", "correctness", "packages/ui"]), {
    options: ["-D", "correctness"],
    targets: ["packages/ui"],
  });
  assert.deepEqual(partitionOxlintArgs(["src", "-f", "json"]), {
    options: ["-f", "json"],
    targets: ["src"],
  });
  assert.deepEqual(partitionOxlintArgs([]), { options: [], targets: [] });
});

test("howells-check applies the auto-discovered preset and runs type-aware rules", async () => {
  const root = await makeConsumerFixture({
    "src/a.ts":
      "export function f() {\n  g();\n}\n\nasync function g() {\n  return 1;\n}\n",
  });

  try {
    const result = await runCheck(root, ["src"]);

    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.output, /Failed to (load|parse)/);
    assert.match(result.output, /no-floating-promises/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("howells-check reports formatter and linter failures in one run", async () => {
  const root = await makeConsumerFixture({
    // Missing semicolons and unindented body fail oxfmt; the floating promise
    // fails oxlint. Both must appear even though the formatter check fails.
    "src/a.ts":
      "export function f() {\ng()\n}\n\nasync function g() {\nreturn 1\n}\n",
  });

  try {
    const result = await runCheck(root, ["src"]);

    assert.notEqual(result.status, 0);
    assert.match(result.output, /Format issues found/);
    assert.match(result.output, /no-floating-promises/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("howells-check forwards space-form value flags to Oxlint", async () => {
  const root = await makeConsumerFixture({
    "src/a.ts":
      "export function f() {\n  g();\n}\n\nasync function g() {\n  return 1;\n}\n",
  });

  try {
    // `json` is the value of --format, not a lint target. If it were mistaken
    // for a target, Oxlint would fail resolving a path named "json" and never
    // emit JSON diagnostics.
    const result = await runCheck(root, ["--format", "json", "src"]);

    assert.notEqual(result.status, 0);
    assert.match(result.output, /"diagnostics"/);
    assert.match(result.output, /no-floating-promises/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
