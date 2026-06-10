import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceDirs = ["apps", "packages", "services", "workers", "examples"];
const requiredNodeVersion = "24.15.0";
const [requiredMajor, requiredMinor, requiredPatch] = requiredNodeVersion
  .split(".")
  .map((part) => Number.parseInt(part, 10));

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
    (entry) => entry.isDirectory() && existsSync(join(directoryPath, entry.name, "package.json")),
  );
};

const hasLikelyWorkspaceLayout = (packageJson) =>
  Boolean(packageJson?.workspaces) || workspaceDirs.some(hasWorkspaceChildren);

const isAtLeastRequiredNodeVersion = (major, minor, patch = 0) => {
  if (major !== requiredMajor) {
    return major > requiredMajor;
  }

  if (minor !== requiredMinor) {
    return minor > requiredMinor;
  }

  return patch >= requiredPatch;
};

const engineSatisfiesRequiredNode = (range) => {
  if (typeof range !== "string") {
    return false;
  }

  const normalizedRange = range.replaceAll(/\s+/gu, "");
  // Match the lower bound; ignore any upper bound (e.g. ">=24.15.0 <25").
  const match = normalizedRange.match(
    /^(?:>=|\^|~)?(?<major>\d+)(?:\.(?<minor>\d+))?(?:\.(?<patch>\d+))?/u,
  );

  if (!match?.groups?.major || !match.groups.minor) {
    return false;
  }

  return isAtLeastRequiredNodeVersion(
    Number(match.groups.major),
    Number(match.groups.minor),
    Number(match.groups.patch ?? 0),
  );
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

  if (!engineSatisfiesRequiredNode(packageJson.engines?.node)) {
    errors.push(`root package.json engines.node must require Node ${requiredNodeVersion}+`);
  }

  const nodeVersion = readNodeVersionFile();
  if (nodeVersion !== requiredNodeVersion) {
    errors.push(`root .node-version must be ${requiredNodeVersion}`);
  }

  if (
    hasLikelyWorkspaceLayout(packageJson) &&
    !existsSync(join(process.cwd(), "pnpm-workspace.yaml"))
  ) {
    errors.push("pnpm-workspace.yaml is required for workspace projects");
  }

  return errors;
};
