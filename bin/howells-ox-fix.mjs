#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolvePackageBin } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const useDangerousFixes = args.includes("--unsafe");
const filteredArgs = args.filter((arg) => arg !== "--unsafe");
const targets = filteredArgs.filter((arg) => !arg.startsWith("-"));
const oxlintOptions = filteredArgs.filter((arg) => arg.startsWith("-"));
const resolvedTargets = targets.length > 0 ? targets : ["."];

function run(packageName, binName, commandArgs) {
	const binPath = resolvePackageBin(packageName, binName);
	const result = spawnSync(binPath, commandArgs, {
		stdio: "inherit",
		env: process.env,
	});

	if (result.error) {
		throw result.error;
	}

	if ((result.status ?? 1) !== 0) {
		process.exit(result.status ?? 1);
	}
}

run("oxfmt", "oxfmt", ["--write", ...resolvedTargets]);
run("oxlint", "oxlint", [
	useDangerousFixes ? "--fix-dangerously" : "--fix",
	...oxlintOptions,
	...resolvedTargets,
]);
