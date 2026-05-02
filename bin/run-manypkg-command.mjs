#!/usr/bin/env node

import { createRequire } from "node:module";
import { runPackageBin } from "./run-package-bin.mjs";

const require = createRequire(import.meta.url);
const helpOptions = new Set(["--help", "-h"]);
const versionOptions = new Set(["--version", "-V"]);

export function printManypkgCommandHelp(command) {
	console.log(`Usage: howells-workspace-${command} [options]\n`);
	console.log(`Runs: manypkg ${command} [options]`);
}

export function printManypkgCliVersion() {
	const { version } = require("@manypkg/cli/package.json");
	console.log(version);
}

export function handleManypkgMetadataCommand(command, args) {
	if (helpOptions.has(args[0])) {
		printManypkgCommandHelp(command);
		return true;
	}

	if (versionOptions.has(args[0])) {
		printManypkgCliVersion();
		return true;
	}

	return false;
}

export function runManypkgCommand(command, args) {
	if (handleManypkgMetadataCommand(command, args)) {
		process.exit(0);
	}

	runPackageBin("@manypkg/cli", "manypkg", [command, ...args]);
}
