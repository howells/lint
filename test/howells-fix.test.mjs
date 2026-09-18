import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

    let status = 0;
    let output = "";

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [fixBin, ...args],
        { cwd: root }
      );
      output = `${stdout}${stderr}`;
    } catch (error) {
      status = error.code;
      output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    }

    // Read the tree back before the temp directory goes, so a test can assert
    // what the fixer did to a file as well as what it said about it.
    const contents = {};
    for (const relativePath of Object.keys(files)) {
      contents[relativePath] = await readFile(
        path.join(root, relativePath),
        "utf8"
      );
    }

    return { contents, output, status };
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
  // The four binaries share one exit path, so they share one message.
  assert.match(result.output, /nothing to do/u);
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

// Consumers run `howells-fix` from a pre-commit hook, so any lint autofix it
// applies to a test file lands in a commit nobody reads. 3.3.4 turned two
// assertion-rewriting Vitest rules off after that happened; 3.3.5 excludes the
// whole file class instead, because the risk belongs to the file rather than
// the rule. `no-useless-escape` carries a safe fix under Oxlint's defaults, so
// it is applied in `src.mjs` and only reported in `src.test.mjs`.
test("reports a fixable finding in a test file without rewriting it", async () => {
  const testSource = 'const pattern = "a\\/b";\nexport { pattern };\n';
  const result = await runFix(
    {
      "src.mjs": testSource,
      "src.test.mjs": testSource,
    },
    ["."]
  );

  assert.equal(result.contents["src.test.mjs"], testSource);
  assert.match(result.output, /src\.test\.mjs.+no-useless-escape/su);
  assert.equal(
    result.contents["src.mjs"],
    'const pattern = "a/b";\nexport { pattern };\n'
  );
});
