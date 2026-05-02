#!/usr/bin/env node

import { createRequire } from "node:module";
import { runPackageBin } from "./run-package-bin.mjs";

const require = createRequire(import.meta.url);
const helpOptions = new Set(["--help", "-h"]);
const versionOptions = new Set(["--version", "-V"]);

function printHelp(command) {
	console.log(`Usage: howells-workspace-${command} [options]\n`);
	console.log(`Runs: manypkg ${command} [options]`);
}

function printVersion() {
	const { version } = require("@manypkg/cli/package.json");
	console.log(version);
}

export function runManypkgCommand(command, args) {
	if (helpOptions.has(args[0])) {
		printHelp(command);
		process.exit(0);
	}

	if (versionOptions.has(args[0])) {
		printVersion();
		process.exit(0);
	}

	runPackageBin("@manypkg/cli", "manypkg", [command, ...args]);
}
