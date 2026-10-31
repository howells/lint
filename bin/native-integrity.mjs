import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

export const checkNativeBundle = (packageRoot) => {
  const root = join(packageRoot, "vendor/tsgolint");
  const manifestBytes = readFileSync(join(root, "manifest.json"));
  const manifest = JSON.parse(manifestBytes);
  const build = JSON.parse(readFileSync(join(root, "build.json")));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(
    build.manifestSha256,
    sha256(manifestBytes),
    "native inputs changed; rebuild with pnpm native:build"
  );
  assert.equal(
    build.buildScriptSha256,
    sha256(readFileSync(join(packageRoot, "scripts/build-native.mjs"))),
    "native builder changed; rebuild with pnpm native:build"
  );
  assert.equal(build.toolchain, manifest.toolchain);
  assert.deepEqual(build.flags, manifest.buildFlags);
  assert.deepEqual(build.environment, manifest.buildEnvironment);
  assert.deepEqual(
    Object.keys(build.targets).sort(),
    Object.keys(manifest.targets).sort()
  );

  for (const [file, expected] of Object.entries(manifest.files)) {
    assert.equal(
      sha256(readFileSync(join(root, file))),
      expected,
      `native input changed: ${file}`
    );
  }
  for (const [target, expected] of Object.entries(manifest.targets)) {
    const binary = join(root, expected.path);
    const stat = lstatSync(binary);
    assert.ok(
      stat.isFile(),
      `native executable must be a regular file: ${target}`
    );
    assert.equal(
      stat.size,
      expected.bytes,
      `native executable size: ${target}`
    );
    assert.equal(
      sha256(readFileSync(binary)),
      expected.sha256,
      `native executable hash: ${target}`
    );
    if (process.platform !== "win32") {
      assert.equal(
        stat.mode & 0o777,
        0o755,
        `native executable mode: ${target}`
      );
    }
    assert.deepEqual(build.targets[target].binary, expected);
    assert.ok(
      build.targets[target].buildInfo.includes(`${manifest.toolchain}\n`)
    );
  }
  return { manifest, build };
};
