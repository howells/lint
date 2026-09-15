import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
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

// Fixtures live outside the repo, with a node_modules symlink back to it so
// Oxlint still resolves Ultracite's bare jsPlugin specifiers and Node type-
// strips the `.ts` config a real consumer writes. Under the repo they would sit
// inside a gitignored directory, and Oxlint 1.78 skips ignored paths even when
// they are named explicitly on the command line ("No files found to lint").
// A local package.json makes the fixture an ESM package the way a consumer
// project is.
const fixtureBase = path.join(
  realpathSync(tmpdir()),
  "howells-lint-check-fixtures"
);

async function makeConsumerFixture(srcFiles) {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, "case-"));

  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
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

// A commit whose staged files are all generated data that the tools ignore
// resolved to an empty path set, which every binary but `howells-fix` treated
// as a failure. That blocked any regenerate-only commit in a pre-commit hook,
// forcing `--no-verify` and switching off every other check with it.
async function runBin(binName, args, root) {
  const binPath = path.join(repoRoot, "bin", `${binName}.mjs`);

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [binPath, ...args],
      { cwd: root }
    );
    return { output: `${stdout}${stderr}`, status: 0 };
  } catch (error) {
    return {
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
      status: error.code,
    };
  }
}

test("an empty path set succeeds for every binary", async () => {
  const root = await mkdtemp(path.join(fixtureBase, "empty-"));

  await mkdir(path.join(root, "data"), { recursive: true });
  await writeFile(path.join(root, "data", "snapshot.bin"), "not lintable\n");

  try {
    for (const [binName, args] of [
      ["howells-oxfmt", ["--check", "data"]],
      ["howells-oxlint", ["data"]],
      ["howells-check", ["data"]],
      ["howells-fix", ["data"]],
    ]) {
      const result = await runBin(binName, args, root);

      assert.equal(
        result.status,
        0,
        `${binName} failed on an empty path set: ${result.output}`
      );
      assert.match(result.output, /nothing to do/);
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("a path that is not on disk still fails", async () => {
  const root = await mkdtemp(path.join(fixtureBase, "missing-"));

  try {
    for (const [binName, args] of [
      ["howells-oxfmt", ["--check", "no-such-dir"]],
      ["howells-check", ["no-such-dir"]],
      ["howells-fix", ["no-such-dir"]],
    ]) {
      const result = await runBin(binName, args, root);

      assert.notEqual(result.status, 0, `${binName} passed on a missing path`);
      assert.match(result.output, /no such path/);
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
