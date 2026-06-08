import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package exposes preferred Oxlint/Oxfmt command aliases", async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(packageJson.bin["howells-check"], "bin/howells-check.mjs");
  assert.equal(packageJson.bin["howells-fix"], "bin/howells-fix.mjs");
  assert.equal(packageJson.bin["howells-ox-check"], "bin/howells-ox-check.mjs");
  assert.equal(packageJson.bin["howells-ox-fix"], "bin/howells-ox-fix.mjs");
});
