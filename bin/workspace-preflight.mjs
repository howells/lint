import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceDirs = ["apps", "packages", "services", "workers", "examples"];

function readRootPackageJson() {
	const packageJsonPath = join(process.cwd(), "package.json");

	if (!existsSync(packageJsonPath)) {
		return {
			errors: ["root package.json is missing"],
			packageJson: undefined,
		};
	}

	try {
		return {
			errors: [],
			packageJson: JSON.parse(readFileSync(packageJsonPath, "utf8")),
		};
	} catch (error) {
		return {
			errors: [`root package.json could not be parsed: ${error.message}`],
			packageJson: undefined,
		};
	}
}

function hasWorkspaceChildren(directory) {
	const directoryPath = join(process.cwd(), directory);

	if (!existsSync(directoryPath)) {
		return false;
	}

	return readdirSync(directoryPath, { withFileTypes: true }).some((entry) => {
		return (
			entry.isDirectory() &&
			existsSync(join(directoryPath, entry.name, "package.json"))
		);
	});
}

function hasLikelyWorkspaceLayout(packageJson) {
	return (
		Boolean(packageJson?.workspaces) || workspaceDirs.some(hasWorkspaceChildren)
	);
}

function isNode20Engine(range) {
	if (typeof range !== "string") {
		return false;
	}

	const normalizedRange = range.replaceAll(/\s+/g, "");

	if (/(^|[<>=~^|])1[0-9](\.|[^0-9]|$)/.test(normalizedRange)) {
		return false;
	}

	return />=?20(\.|[^0-9]|$)|\^20(\.|[^0-9]|$)|~20(\.|[^0-9]|$)/.test(
		normalizedRange,
	);
}

export function runWorkspacePreflight() {
	const { errors, packageJson } = readRootPackageJson();

	if (!packageJson) {
		return errors;
	}

	if (typeof packageJson.packageManager !== "string") {
		errors.push("root package.json must declare packageManager");
	} else if (!packageJson.packageManager.startsWith("pnpm@")) {
		errors.push("root package.json packageManager must use pnpm");
	}

	if (!isNode20Engine(packageJson.engines?.node)) {
		errors.push("root package.json engines.node must require Node 20+");
	}

	if (
		hasLikelyWorkspaceLayout(packageJson) &&
		!existsSync(join(process.cwd(), "pnpm-workspace.yaml"))
	) {
		errors.push("pnpm-workspace.yaml is required for workspace projects");
	}

	return errors;
}
