import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  discoverUnits,
  splitScriptArgs,
  unitDirectories,
  unitFrom,
  workspaceGlobs,
} from "../bin/ratchet-units.mjs";

const scratch = async () => mkdtemp(path.join(tmpdir(), "ratchet-units-"));

const withManifest = async (root, directory, manifest) => {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(root, directory), { recursive: true });
  await writeFile(
    path.join(root, directory, "package.json"),
    JSON.stringify(manifest)
  );
};

test("splitScriptArgs keeps a quoted exclude in one argument", () => {
  assert.deepEqual(splitScriptArgs("howells-check src '!**/*.gen.ts' test"), [
    "howells-check",
    "src",
    "!**/*.gen.ts",
    "test",
  ]);
  assert.deepEqual(splitScriptArgs('howells-check "src dir"'), [
    "howells-check",
    "src dir",
  ]);
});

test("workspaceGlobs reads the packages list and stops at the next key", async () => {
  const root = await scratch();
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    [
      "packages:",
      "  - apps/*",
      '  - "packages/*"',
      "  - packages/domain/* # nested",
      "",
      "catalog:",
      '  react: "19.0.0"',
    ].join("\n")
  );

  assert.deepEqual(workspaceGlobs(root), [
    "apps/*",
    "packages/*",
    "packages/domain/*",
  ]);
});

test("workspaceGlobs is empty for a repo with no workspace file", async () => {
  assert.deepEqual(workspaceGlobs(await scratch()), []);
});

test("unitDirectories always offers the root and honours a negated glob", async () => {
  const root = await scratch();
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n  - '!packages/fixtures'\n"
  );
  await withManifest(root, "packages/db", { name: "db" });
  await withManifest(root, "packages/fixtures", { name: "fixtures" });

  assert.deepEqual(unitDirectories(root), [".", "packages/db"]);
});

test("unitFrom takes the howells-check segment's targets and drops its flags", async () => {
  const root = await scratch();
  await withManifest(root, "apps/web", {
    scripts: {
      lint: "howells-check src '!**/*.gen.ts' --deny-warnings && tsc --noEmit",
    },
  });

  const unit = unitFrom(root, "apps/web");

  assert.equal(unit.counted, true);
  assert.deepEqual(unit.targets, ["src", "!**/*.gen.ts"]);
  assert.deepEqual(unit.options, ["--deny-warnings"]);
});

test("unitFrom finds the check segment after another command", async () => {
  const root = await scratch();
  await withManifest(root, ".", {
    scripts: { lint: "howells-workspace-check && howells-check *.ts scripts" },
  });

  assert.deepEqual(unitFrom(root, ".").targets, ["*.ts", "scripts"]);
});

test("unitFrom defaults a bare howells-check to the whole directory", async () => {
  const root = await scratch();
  await withManifest(root, ".", { scripts: { lint: "howells-check" } });

  assert.deepEqual(unitFrom(root, ".").targets, ["."]);
});

test("a howells-oxfmt-only package is a format-only unit", async () => {
  const root = await scratch();
  await withManifest(root, "packages/tailwind-config", {
    scripts: { lint: "howells-oxfmt --check ." },
  });

  const unit = unitFrom(root, "packages/tailwind-config");

  assert.equal(unit.counted, false);
  assert.deepEqual(unit.targets, ["."]);
});

test("a lint script that runs the ratchet is an error, never a silent skip", async () => {
  const root = await scratch();
  await withManifest(root, ".", {
    scripts: { lint: "howells-ratchet && howells-workspace-check" },
  });

  assert.match(unitFrom(root, ".").error, /names no lint targets/u);
});

test("a lint script naming neither binary is not a unit", async () => {
  const root = await scratch();
  await withManifest(root, ".", { scripts: { lint: "turbo run lint" } });

  assert.equal(unitFrom(root, "."), undefined);
});

test("discoverUnits adds a baseline targets override for a root that names none", async () => {
  const root = await scratch();
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n");
  await withManifest(root, ".", {
    scripts: { lint: "turbo run lint && howells-workspace-check" },
  });

  const { units, errors } = discoverUnits(root, {
    ".": ["*.ts", "conformance"],
  });

  assert.deepEqual(errors, []);
  assert.equal(units.length, 1);
  assert.deepEqual(units[0].targets, ["*.ts", "conformance"]);
  assert.equal(units[0].counted, true);
});

test("an override never displaces a unit that names its own targets", async () => {
  const root = await scratch();
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n");
  await withManifest(root, ".", { scripts: { lint: "howells-check src" } });

  const { units } = discoverUnits(root, { ".": ["everything"] });

  assert.equal(units.length, 1);
  assert.deepEqual(units[0].targets, ["src"]);
});

test("an override naming a directory with no package.json is an error", async () => {
  const root = await scratch();
  await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n");
  await withManifest(root, ".", { scripts: { lint: "howells-check src" } });

  const { errors } = discoverUnits(root, { "apps/ghost": ["src"] });

  assert.match(errors[0], /no package\.json there/u);
});
