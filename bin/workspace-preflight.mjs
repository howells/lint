import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceDirs = ["apps", "packages", "services", "workers", "examples"];

// Floor, not a pin: the tool refuses Node older than this regardless of what a
// repo pins. The repo's own `.node-version` is the source of truth for the
// exact version to run; this only guarantees it never drops below a known-good
// baseline.
const minimumNodeVersion = "24.15.0";
const [minimumMajor, minimumMinor, minimumPatch] = minimumNodeVersion
  .split(".")
  .map((part) => Number.parseInt(part, 10));
const minimumVersion = {
  major: minimumMajor,
  minor: minimumMinor,
  patch: minimumPatch,
};

const readRootPackageJson = () => {
  const packageJsonPath = join(process.cwd(), "package.json");

  if (!existsSync(packageJsonPath)) {
    return {
      errors: ["root package.json is missing"],
      packageJson: null,
    };
  }

  try {
    return {
      errors: [],
      packageJson: JSON.parse(readFileSync(packageJsonPath, "utf-8")),
    };
  } catch (error) {
    return {
      errors: [`root package.json could not be parsed: ${error.message}`],
      packageJson: null,
    };
  }
};

const hasWorkspaceChildren = (directory) => {
  const directoryPath = join(process.cwd(), directory);

  if (!existsSync(directoryPath)) {
    return false;
  }

  return readdirSync(directoryPath, { withFileTypes: true }).some(
    (entry) =>
      entry.isDirectory() &&
      existsSync(join(directoryPath, entry.name, "package.json"))
  );
};

const hasLikelyWorkspaceLayout = (packageJson) =>
  Boolean(packageJson?.workspaces) || workspaceDirs.some(hasWorkspaceChildren);

// Numeric, per-part `candidate >= floor` for parsed {major, minor, patch}
// versions. Compares numbers, never strings, so 24.16.0 correctly outranks
// 24.9.0 and a floor of 24.15.0 is satisfied by any 24.15+/25+.
const isAtLeastVersion = (candidate, floor) => {
  if (candidate.major !== floor.major) {
    return candidate.major > floor.major;
  }

  if (candidate.minor !== floor.minor) {
    return candidate.minor > floor.minor;
  }

  return candidate.patch >= floor.patch;
};

// Parse an exact `x.y.z` (optionally `v`-prefixed) version as pinned in a
// `.node-version` file. Returns null when the value is not a plain semver.
const parseExactVersion = (value) => {
  const match = value
    .trim()
    .match(/^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/u);

  if (!match) {
    return null;
  }

  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
  };
};

// Parse the lower bound of an engines range such as ">=24.16.0 <25". Missing
// minor/patch default to 0 (">=24" → 24.0.0). Returns null when there is no
// leading numeric bound to read.
const parseEngineLowerBound = (range) => {
  if (typeof range !== "string") {
    return null;
  }

  const normalizedRange = range.replaceAll(/\s+/gu, "");
  const match = normalizedRange.match(
    /^(?:>=|\^|~)?(?<major>\d+)(?:\.(?<minor>\d+))?(?:\.(?<patch>\d+))?/u
  );

  if (!match?.groups?.major) {
    return null;
  }

  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor ?? 0),
    patch: Number(match.groups.patch ?? 0),
  };
};

const readNodeVersionFile = () => {
  const nodeVersionPath = join(process.cwd(), ".node-version");

  if (!existsSync(nodeVersionPath)) {
    return null;
  }

  return readFileSync(nodeVersionPath, "utf-8").trim();
};

export const runWorkspacePreflight = () => {
  const { errors, packageJson } = readRootPackageJson();

  if (!packageJson) {
    return errors;
  }

  if (typeof packageJson.packageManager !== "string") {
    errors.push("root package.json must declare packageManager");
  } else if (!packageJson.packageManager.startsWith("pnpm@")) {
    errors.push("root package.json packageManager must use pnpm");
  }

  // `.node-version` is the source of truth for the pinned Node version. It must
  // exist, be an exact x.y.z version, and sit at or above the tool's floor.
  const nodeVersionRaw = readNodeVersionFile();
  let pinnedVersion = null;

  if (nodeVersionRaw === null) {
    errors.push("root .node-version is missing");
  } else {
    pinnedVersion = parseExactVersion(nodeVersionRaw);

    if (!pinnedVersion) {
      errors.push(
        `root .node-version must be an exact x.y.z version; found "${nodeVersionRaw}"`
      );
    } else if (!isAtLeastVersion(pinnedVersion, minimumVersion)) {
      errors.push(
        `root .node-version ${nodeVersionRaw} is below the minimum supported Node ${minimumNodeVersion}`
      );
    }
  }

  // engines.node must exist and its lower bound must cover the pinned version,
  // so anyone honouring engines runs at least the version the repo pins.
  const engineRange = packageJson.engines?.node;
  const engineLowerBound = parseEngineLowerBound(engineRange);

  if (!engineLowerBound) {
    errors.push(
      "root package.json engines.node must declare a Node version range"
    );
  } else if (
    pinnedVersion &&
    !isAtLeastVersion(engineLowerBound, pinnedVersion)
  ) {
    errors.push(
      `root package.json engines.node lower bound (${engineRange}) must cover the pinned Node ${nodeVersionRaw}`
    );
  }

  if (
    hasLikelyWorkspaceLayout(packageJson) &&
    !existsSync(join(process.cwd(), "pnpm-workspace.yaml"))
  ) {
    errors.push("pnpm-workspace.yaml is required for workspace projects");
  }

  return errors;
};
