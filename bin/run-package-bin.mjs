#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";

import { inheritedEnv } from "./env.mjs";
import { resolveBundledTsgolint } from "./resolve-bundled-tsgolint.mjs";

const require = createRequire(import.meta.url);
const currentDir = import.meta.dirname;

const resolvePackageJsonPath = (packageName) => {
  try {
    return require.resolve(`${packageName}/package.json`);
  } catch {
    const packageSegments = packageName.split("/");
    let searchDir = currentDir;

    while (true) {
      const candidate = join(
        searchDir,
        "..",
        "node_modules",
        ...packageSegments,
        "package.json"
      );

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

  throw new Error(
    `Could not resolve package.json for package '${packageName}'.`
  );
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

  throw new Error(
    `Could not resolve bin '${binName}' for package '${packageName}'.`
  );
};

// The bundled backend contains the pinned native strict-void-return correction.
// Preserve an explicit upstream override, including executable and JS launchers.
const spawnEnv = (packageName) => {
  const env = inheritedEnv();

  if (
    (packageName !== "oxlint" && packageName !== "ultracite") ||
    env.OXLINT_TSGOLINT_PATH
  ) {
    return env;
  }

  return {
    ...env,
    OXLINT_TSGOLINT_PATH: resolveBundledTsgolint(),
  };
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

// spawnSync buffers the child's output in memory and kills the child once it
// exceeds maxBuffer, reporting the failure as ENOBUFS. The default is 1MB, and
// a monorepo package with a lint backlog can exceed that: oxlint prints one
// block per finding, so a package with tens of thousands of findings produces
// tens of megabytes. A repo fixing a backlog is exactly when the wrapper must
// keep working, so the cap is raised high enough for any plausible finding set
// while still catching a runaway child.
const CAPTURE_MAX_BUFFER_BYTES = 256 * 1024 * 1024;

// Same resolution and environment as spawnPackageBin, but captures stdout and
// stderr as strings instead of inheriting the parent's streams. Callers that
// need to inspect a tool's output (e.g. to tell an empty path set apart from a
// real failure) use this and re-emit the captured output themselves.
//
// `cwd` matters to any caller measuring a workspace: both tools resolve their
// nested config and their tsconfig relative to the working directory, so a
// package has to be measured from its own directory to be measured the way its
// own lint script measures it.
export const spawnPackageBinCapture = (packageName, binName, args, cwd) => {
  const binPath = resolvePackageBin(packageName, binName);
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd,
    env: spawnEnv(packageName),
    encoding: "utf-8",
    maxBuffer: CAPTURE_MAX_BUFFER_BYTES,
  });
};

export const runPackageBin = (packageName, binName, args) => {
  const result = spawnPackageBin(packageName, binName, args);

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
};
