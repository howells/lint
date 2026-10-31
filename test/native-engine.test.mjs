import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkNativeBundle } from "../bin/native-integrity.mjs";
import { resolveBundledTsgolint } from "../bin/resolve-bundled-tsgolint.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

test("the native selector rejects unsupported platforms explicitly", () => {
  assert.throws(
    () => resolveBundledTsgolint("freebsd", "x64"),
    /does not support freebsd-x64/u
  );
});

test("the native bundle is complete before prepush or pack", () => {
  checkNativeBundle(root);
});

test("prepack refuses missing binaries, altered payloads and stale provenance", (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "howells-native-prepack-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  for (const file of [
    "scripts/build-native.mjs",
    "scripts/check-native.mjs",
    "bin/native-integrity.mjs",
    "vendor/tsgolint",
  ]) {
    cpSync(join(root, file), join(fixture, file), { recursive: true });
  }
  const { manifest } = checkNativeBundle(fixture);
  const binary = join(
    fixture,
    "vendor/tsgolint",
    Object.values(manifest.targets)[0].path
  );
  const bytes = readFileSync(binary);
  const check = () =>
    spawnSync(process.execPath, [join(fixture, "scripts/check-native.mjs")], {
      encoding: "utf8",
    });
  unlinkSync(binary);
  assert.notEqual(check().status, 0);
  writeFileSync(binary, bytes, { mode: 0o755 });
  const altered = Buffer.from(bytes);
  altered[altered.length - 1] ^= 1;
  writeFileSync(binary, altered);
  assert.match(check().stderr, /native executable hash/u);
  writeFileSync(binary, bytes);
  writeFileSync(join(fixture, "vendor/tsgolint/build.json"), "{}\n");
  assert.notEqual(check().status, 0);
});
