import { accessSync, constants, readFileSync, statSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const resolveBundledTsgolint = (
  platform = process.platform,
  arch = process.arch
) => {
  const root = new URL("../vendor/tsgolint/", import.meta.url);
  const manifest = JSON.parse(
    readFileSync(new URL("manifest.json", root), "utf8")
  );
  const target = manifest.targets[`${platform}-${arch}`];

  if (!target) {
    throw new Error(
      `Bundled tsgolint does not support ${platform}-${arch}. Set OXLINT_TSGOLINT_PATH to a compatible executable.`
    );
  }

  const binary = fileURLToPath(new URL(target.path, root));
  accessSync(
    binary,
    platform === "win32" ? constants.R_OK : constants.R_OK | constants.X_OK
  );
  if (!statSync(binary).isFile() || statSync(binary).size !== target.bytes) {
    throw new Error(`Broken bundled tsgolint executable: ${binary}`);
  }
  return binary;
};
