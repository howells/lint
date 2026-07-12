import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";

import { runWorkspacePreflight } from "../bin/workspace-preflight.mjs";

// runWorkspacePreflight reads from process.cwd(), so each case builds a temp
// repo, chdir's into it, runs the check, then restores the previous cwd.
async function preflight(files) {
  const root = await mkdtemp(path.join(tmpdir(), "howells-preflight-"));
  const previousCwd = process.cwd();

  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(root, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    }

    process.chdir(root);
    return runWorkspacePreflight();
  } finally {
    process.chdir(previousCwd);
    await rm(root, { force: true, recursive: true });
  }
}

const packageJson = (engines) =>
  JSON.stringify({
    packageManager: "pnpm@11.5.1",
    engines: engines === undefined ? undefined : { node: engines },
  });

test("accepts a pinned patch above the floor when engines covers it", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=24.16.0 <25"),
    ".node-version": "24.16.0\n",
  });

  assert.deepEqual(errors, []);
});

test("accepts a pin exactly at the floor", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=24.15.0 <25"),
    ".node-version": "24.15.0\n",
  });

  assert.deepEqual(errors, []);
});

test("rejects a pin below the floor", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=22.18.0"),
    ".node-version": "22.18.0\n",
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /\.node-version 22\.18\.0 is below the minimum/u);
});

test("rejects a non-semver .node-version", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=24.16.0"),
    ".node-version": "lts/*\n",
  });

  assert.ok(errors.some((error) => /must be an exact x\.y\.z/u.test(error)));
});

test("reports a missing .node-version", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=24.16.0"),
  });

  assert.ok(errors.some((error) => /\.node-version is missing/u.test(error)));
});

test("rejects engines whose lower bound is below the pinned version", async () => {
  const errors = await preflight({
    "package.json": packageJson(">=24.15.0 <25"),
    ".node-version": "24.16.0\n",
  });

  assert.ok(
    errors.some((error) =>
      /engines\.node lower bound .* must cover/u.test(error)
    )
  );
});

test("reports missing engines.node", async () => {
  const errors = await preflight({
    "package.json": packageJson(undefined),
    ".node-version": "24.16.0\n",
  });

  assert.ok(errors.some((error) => /engines\.node must declare/u.test(error)));
});
