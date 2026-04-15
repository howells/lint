#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const currentDir = dirname(fileURLToPath(import.meta.url));

function resolvePackageJsonPath(packageName) {
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
}

function resolvePackageBin(packageName, binName) {
  const packageJsonPath = resolvePackageJsonPath(packageName);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const packageDir = dirname(packageJsonPath);
  const binField = packageJson.bin;

  if (typeof binField === "string") {
    return join(packageDir, binField);
  }

  if (binField && typeof binField === "object" && binField[binName]) {
    return join(packageDir, binField[binName]);
  }

  throw new Error(`Could not resolve bin '${binName}' for package '${packageName}'.`);
}

export function runPackageBin(packageName, binName, args) {
  const binPath = resolvePackageBin(packageName, binName);
  const result = spawnSync(binPath, args, {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}
