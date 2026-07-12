import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const fixBin = path.join(repoRoot, "bin", "howells-fix.mjs");

async function runFix(files, args) {
  const root = await mkdtemp(path.join(tmpdir(), "howells-fix-"));

  try {
    for (const [relativePath, content] of Object.entries(files)) {
      await writeFile(path.join(root, relativePath), content);
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [fixBin, ...args],
        { cwd: root }
      );
      return { status: 0, output: `${stdout}${stderr}` };
    } catch (error) {
      return {
        status: error.code,
        output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
      };
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

test("exits 0 when the passed paths hold nothing lintable", async () => {
  // A commit of only JSON/CSS: oxfmt handles them, oxlint finds nothing to
  // lint. An empty set is success for a fixer.
  const result = await runFix(
    {
      "config.json": '{ "a": 1 }\n',
      "style.css": "body {\n  color: red;\n}\n",
    },
    ["config.json", "style.css"]
  );

  assert.equal(result.status, 0);
  assert.match(result.output, /nothing to fix/u);
});

test("exits non-zero when an explicitly-named path does not exist", async () => {
  const result = await runFix({}, ["does-not-exist.js"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /no such path/u);
});

test("still fails on a genuine unfixable lint error", async () => {
  const result = await runFix({ "bad.js": "const x = 1;\nconst x = 2;\n" }, [
    "bad.js",
  ]);

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.output, /nothing to fix/u);
});
