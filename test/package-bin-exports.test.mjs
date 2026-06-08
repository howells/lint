import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package exposes one canonical high-level command surface", async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(packageJson.bin["howells-check"], "bin/howells-check.mjs");
  assert.equal(packageJson.bin["howells-fix"], "bin/howells-fix.mjs");
  assert.equal(packageJson.bin["howells-workspace-check"], "bin/howells-workspace-check.mjs");
  assert.equal(packageJson.bin["howells-workspace-fix"], "bin/howells-workspace-fix.mjs");
  assert.equal(packageJson.bin["howells-biome"], "bin/howells-biome.mjs");
  assert.equal(packageJson.bin["howells-oxlint"], "bin/howells-oxlint.mjs");
  assert.equal(packageJson.bin["howells-oxfmt"], "bin/howells-oxfmt.mjs");
  assert.equal(packageJson.bin["howells-ultracite"], "bin/howells-ultracite.mjs");

  assert.equal(packageJson.bin["howells-lint"], undefined);
  assert.equal(packageJson.bin["howells-format"], undefined);
  assert.equal(packageJson.bin["howells-lint-strict"], undefined);
  assert.equal(packageJson.bin["howells-ox-check"], undefined);
  assert.equal(packageJson.bin["howells-ox-fix"], undefined);
});
