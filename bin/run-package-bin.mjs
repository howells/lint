#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";
import { inheritedEnv } from "./env.mjs";

const require = createRequire(import.meta.url);
const currentDir = import.meta.dirname;

const resolvePackageJsonPath = (packageName) => {
  try {
    return require.resolve(`${packageName}/package.json`);
  } catch {
    const packageSegments = packageName.split("/");
    let searchDir = currentDir;

    while (true) {
      const candidate = join(searchDir, "..", "node_modules", ...packageSegments, "package.json");

      if (existsSync(candidate)) {
        return candidate;
      }

      const parentDir = dirname(searchDir);

      if (parentDir === searchDir) {
        break;
      }

      searchDir = parentDir;
    }
  }

  throw new Error(`Could not resolve package.json for package '${packageName}'.`);
};

export const resolvePackageBin = (packageName, binName) => {
  const packageJsonPath = resolvePackageJsonPath(packageName);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const packageDir = dirname(packageJsonPath);
  const binField = packageJson.bin;

  if (typeof binField === "string") {
    return join(packageDir, binField);
  }

  if (binField && typeof binField === "object" && binField[binName]) {
    return join(packageDir, binField[binName]);
  }

  throw new Error(`Could not resolve bin '${binName}' for package '${packageName}'.`);
};

// Oxlint's type-aware mode discovers the tsgolint executable by walking up from
// the working directory for `node_modules/.bin/tsgolint`. Consumers who install
// only `@howells/lint` keep tsgolint inside this package's dependency tree, out
// of that search path, so point Oxlint straight at it. Any of the executable,
// the pnpm bin shim, or tsgolint's own JS launcher is accepted here.
const spawnEnv = (packageName) => {
  const env = inheritedEnv();

  if (packageName !== "oxlint" || env.OXLINT_TSGOLINT_PATH) {
    return env;
  }

  try {
    return { ...env, OXLINT_TSGOLINT_PATH: resolvePackageBin("oxlint-tsgolint", "tsgolint") };
  } catch {
    return env;
  }
};

// Spawn the resolved bin through the current Node executable rather than
// executing it directly. Every package we wrap ships a `#!/usr/bin/env node`
// script, so this is behavior-preserving while removing any dependency on the
// file's executable bit or a POSIX shebang (which Windows ignores).
export const spawnPackageBin = (packageName, binName, args) => {
  const binPath = resolvePackageBin(packageName, binName);
  return spawnSync(process.execPath, [binPath, ...args], {
    env: spawnEnv(packageName),
    stdio: "inherit",
  });
};

export const runPackageBin = (packageName, binName, args) => {
  const result = spawnPackageBin(packageName, binName, args);

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
};
