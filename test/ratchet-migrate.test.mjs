import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  formatFixture,
  makeFixture,
  offendingSource,
  runRatchet,
  runRatchetJson,
} from "./ratchet-fixture.mjs";

const baselineOf = async (root) =>
  JSON.parse(await readFile(path.join(root, "lint-baseline.json"), "utf-8"));

const writeLegacy = async (root, relative, contents) => {
  await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
  await writeFile(
    path.join(root, relative),
    `${JSON.stringify(contents, null, 2)}\n`
  );
  await formatFixture(root);
};

// The monorepo family's shape: scripts/lint-baseline.json holding per-unit maps.
test("a per-unit scripts/lint-baseline.json migrates structurally", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
      "packages/db": { name: "db", scripts: { lint: "howells-check src" } },
    },
    files: {
      "apps/web/src/a.js": offendingSource("a"),
      "packages/db/src/b.js": offendingSource("b"),
    },
  });

  const legacy = {
    "packages/db": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
    "apps/web": { "eslint(no-debugger)": 1, "eslint(eqeqeq)": 1 },
  };
  await writeLegacy(root, "scripts/lint-baseline.json", legacy);

  const { status } = await runRatchet(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.equal(
    existsSync(path.join(root, "scripts/lint-baseline.json")),
    false
  );

  // The counts that arrive are the counts that were there, keys sorted.
  const { version, units } = await baselineOf(root);
  assert.equal(version, 1);
  assert.deepEqual(units, {
    "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
    "packages/db": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });

  assert.equal((await runRatchet(root)).status, 0);
});

// The single-unit family's shape: one flat map for the whole repo, which in a
// one-unit repo is that unit's map.
test("a flat scripts/lint-baseline.json migrates onto the one unit", async () => {
  const root = await makeFixture({
    rootManifest: { name: "single", scripts: { lint: "howells-check src" } },
    files: { "src/a.js": offendingSource("a") },
  });

  await writeLegacy(root, "scripts/lint-baseline.json", {
    "eslint(no-debugger)": 1,
    "eslint(eqeqeq)": 1,
  });

  const { status } = await runRatchet(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.deepEqual((await baselineOf(root)).units, {
    ".": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });
  assert.equal((await runRatchet(root)).status, 0);
});

// materialdesk's shape: a root lint-ratchet.json carrying per-unit rule counts
// alongside per-unit unformatted-file counts.
test("a lint-ratchet.json migrates its rules and its unformatted counts", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
    },
    files: { "apps/web/src/a.js": offendingSource("a") },
  });

  await writeLegacy(root, "lint-ratchet.json", {
    rules: { "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 } },
    unformatted: { "apps/web": 1 },
  });
  await writeFile(
    path.join(root, "apps/web/src/ugly.js"),
    "export const ugly =    1\n"
  );

  const { status } = await runRatchet(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.equal(existsSync(path.join(root, "lint-ratchet.json")), false);

  const baseline = await baselineOf(root);
  assert.deepEqual(baseline.units, {
    "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });
  assert.deepEqual(baseline.unformatted, { "apps/web": 1 });

  // The unformatted opt-in survives, so the one unformatted file still passes
  // rather than failing the hard formatting check.
  assert.equal((await runRatchet(root)).status, 0);
});

// A per-package file: one flat map inside the package it belongs to.
test("a packages/*/scripts/lint-baseline.json migrates onto that package", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "packages/db": { name: "db", scripts: { lint: "howells-check src" } },
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
    },
    files: {
      "packages/db/src/b.js": offendingSource("b"),
      "apps/web/src/a.js": offendingSource("a"),
    },
  });

  await writeLegacy(root, "packages/db/scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 1,
    "eslint(no-debugger)": 1,
  });
  await writeLegacy(root, "apps/web/scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 1,
    "eslint(no-debugger)": 1,
  });

  const { status } = await runRatchet(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.deepEqual((await baselineOf(root)).units, {
    "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
    "packages/db": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });
  assert.equal((await runRatchet(root)).status, 0);
});

// A repo-wide sum across several units cannot be split, so it is re-measured and
// redistributed — and only while the totals have not risen.
test("a repo-wide sum across several units is redistributed at the same total", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
      "packages/db": { name: "db", scripts: { lint: "howells-check src" } },
    },
    files: {
      "apps/web/src/a.js": offendingSource("a"),
      "packages/db/src/b.js": offendingSource("b"),
    },
  });

  await writeLegacy(root, "scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 2,
    "eslint(no-debugger)": 2,
  });

  const { status, json } = await runRatchetJson(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.equal(json.total, 4);
  assert.deepEqual((await baselineOf(root)).units, {
    "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
    "packages/db": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });
});

test("a repo-wide sum that no longer holds refuses to migrate", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
      "packages/db": { name: "db", scripts: { lint: "howells-check src" } },
    },
    files: {
      "apps/web/src/a.js": offendingSource("a"),
      "packages/db/src/b.js": offendingSource("b"),
    },
  });

  await writeLegacy(root, "scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 1,
    "eslint(no-debugger)": 2,
  });

  const refused = await runRatchetJson(root, ["--migrate"]);

  assert.equal(refused.status, 1);
  assert.match(refused.json.error, /eslint\(eqeqeq\) {2}2 > 1/u);
  assert.equal(existsSync(path.join(root, "scripts/lint-baseline.json")), true);

  const allowed = await runRatchet(root, ["--migrate", "--allow-rise"]);
  assert.equal(allowed.status, 0);
  assert.equal(existsSync(path.join(root, "lint-baseline.json")), true);
});

test("a check refuses to run while a legacy baseline is still in the repo", async () => {
  const root = await makeFixture({
    rootManifest: { name: "single", scripts: { lint: "howells-check src" } },
    files: { "src/a.js": offendingSource("a") },
  });
  await writeLegacy(root, "scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 1,
  });

  const { status, json } = await runRatchetJson(root);

  assert.equal(status, 2);
  assert.match(json.error, /Run `howells-ratchet --migrate`/u);
});

test("a migration whose numbers are already out of date says by how much", async () => {
  const root = await makeFixture({
    rootManifest: { name: "single", scripts: { lint: "howells-check src" } },
    files: { "src/a.js": offendingSource("a") },
  });

  // A baseline written when the repo counted fewer findings — the shape a
  // variant that counted only errors leaves behind.
  await writeLegacy(root, "scripts/lint-baseline.json", {
    "eslint(eqeqeq)": 1,
  });

  const { status, json } = await runRatchetJson(root, ["--migrate"]);

  assert.equal(status, 0);
  assert.equal(json.total, 1);
  assert.equal(json.measured, 2);
  assert.deepEqual(json.risen, [
    { unit: ".", rule: "eslint(no-debugger)", now: 1, was: 0 },
  ]);

  // The check does fail until the difference is recorded deliberately.
  assert.equal((await runRatchet(root)).status, 1);
  assert.equal((await runRatchet(root, ["--write", "--allow-rise"])).status, 0);
  assert.equal((await runRatchet(root)).status, 0);
});

test("--migrate with nothing to migrate says so", async () => {
  const root = await makeFixture({
    rootManifest: { name: "single", scripts: { lint: "howells-check src" } },
    files: { "src/a.js": offendingSource("a") },
  });

  const { status, json } = await runRatchetJson(root, ["--migrate"]);

  assert.equal(status, 2);
  assert.match(json.error, /no legacy baseline to migrate/u);
});
