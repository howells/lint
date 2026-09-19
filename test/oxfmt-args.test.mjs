import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  shadowedOxfmtConfigs,
  withOxfmtConfig,
} from "../bin/resolve-oxfmt-config.mjs";

test("withOxfmtConfig passes an explicit config through unchanged", () => {
  assert.deepEqual(withOxfmtConfig(["--config", "custom.mjs", "src"]), [
    "--config",
    "custom.mjs",
    "src",
  ]);
  assert.deepEqual(withOxfmtConfig(["--config=custom.mjs", "src"]), [
    "--config=custom.mjs",
    "src",
  ]);
  assert.deepEqual(withOxfmtConfig(["-c", "custom.mjs", "src"]), [
    "-c",
    "custom.mjs",
    "src",
  ]);
});

test("withOxfmtConfig discovers the documented project config", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-oxfmt-config-"));
  const configPath = path.join(root, "oxfmt.config.ts");
  const workspacePackage = path.join(root, "apps", "web");

  try {
    await mkdir(workspacePackage, { recursive: true });
    await writeFile(configPath, "export default {};\n");

    assert.deepEqual(withOxfmtConfig(["--check", "src"], workspacePackage), [
      "--config",
      configPath,
      "--check",
      "src",
    ]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("withOxfmtConfig falls back to the packaged Howells preset", () => {
  const emptyRoot = path.join(tmpdir(), "howells-oxfmt-no-project-config");
  const expectedConfig = fileURLToPath(
    new URL("../oxfmt/index.mjs", import.meta.url)
  );

  assert.deepEqual(withOxfmtConfig(["--check", "src"], emptyRoot), [
    "--config",
    expectedConfig,
    "--check",
    "src",
  ]);
});

test("withOxfmtConfig preserves Oxfmt's auto-discovered JSON config", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-oxfmt-json-config-"));

  try {
    await writeFile(path.join(root, ".oxfmtrc.json"), "{}\n");

    assert.deepEqual(withOxfmtConfig(["--check", "src"], root), [
      "--check",
      "src",
    ]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("shadowedOxfmtConfigs names nested configs a pinned config would bypass", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-oxfmt-shadow-"));

  try {
    await writeFile(path.join(root, "oxfmt.config.ts"), "export default {};\n");
    await mkdir(path.join(root, "packages", "ui"), { recursive: true });
    await writeFile(
      path.join(root, "packages", "ui", "oxfmt.config.ts"),
      "export default {};\n"
    );
    await mkdir(path.join(root, "apps", "web"), { recursive: true });
    await writeFile(
      path.join(root, "apps", "web", ".oxfmtrc.json"),
      "{}\n"
    );
    await mkdir(path.join(root, "node_modules", "dep"), { recursive: true });
    await writeFile(
      path.join(root, "node_modules", "dep", "oxfmt.config.ts"),
      "export default {};\n"
    );

    assert.deepEqual(shadowedOxfmtConfigs(["."], root), [
      path.join("apps", "web", ".oxfmtrc.json"),
      path.join("packages", "ui", "oxfmt.config.ts"),
    ]);
    assert.deepEqual(shadowedOxfmtConfigs(["package.json"], root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
