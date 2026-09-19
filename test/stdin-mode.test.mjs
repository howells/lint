import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { hasStdinFlag } from "../bin/stdin-mode.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const binPath = (name) => path.join(repoRoot, "bin", `${name}.mjs`);

// Run a wrapper with `input` on its stdin, the way a consumer piping source
// through the formatter does.
const runWithStdin = (name, args, input) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [binPath(name), ...args], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));

    child.stdin.end(input);
  });

test("howells-oxfmt formats source piped through --stdin-filepath", async () => {
  const { status, stdout } = await runWithStdin(
    "howells-oxfmt",
    ["--stdin-filepath=x.ts"],
    "const   x=1\n"
  );

  assert.equal(status, 0);
  assert.equal(stdout, "const x = 1;\n");
});

test("howells-oxfmt accepts the space form of --stdin-filepath", async () => {
  const { status, stdout } = await runWithStdin(
    "howells-oxfmt",
    ["--stdin-filepath", "x.ts"],
    "const   x=1\n"
  );

  assert.equal(status, 0);
  assert.equal(stdout, "const x = 1;\n");
});

test("howells-oxfmt fails on unparseable source read from stdin", async () => {
  const { status, stdout } = await runWithStdin(
    "howells-oxfmt",
    ["--stdin-filepath=x.ts"],
    "const = = =\n"
  );

  assert.notEqual(status, 0);
  assert.equal(stdout, "");
});

for (const command of ["howells-oxlint", "howells-check", "howells-fix"]) {
  test(`${command} refuses a stdin request instead of returning nothing`, async () => {
    const { status, stdout, stderr } = await runWithStdin(
      command,
      ["--stdin-filepath=x.ts"],
      "const   x=1\n"
    );

    assert.notEqual(status, 0);
    assert.equal(stdout, "");
    assert.match(stderr, new RegExp(`^${command}: reading source from stdin`));
  });
}

test("hasStdinFlag matches both flag forms and nothing else", () => {
  assert.equal(hasStdinFlag(["--stdin-filepath=x.ts"]), true);
  assert.equal(hasStdinFlag(["--stdin-filepath", "x.ts"]), true);
  assert.equal(hasStdinFlag(["--check", "src"]), false);
  assert.equal(hasStdinFlag(["--stdin"], ["--stdin-filepath"]), false);
});
