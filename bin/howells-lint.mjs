#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const biomeCommands = new Set([
	"version",
	"rage",
	"start",
	"stop",
	"check",
	"lint",
	"format",
	"ci",
	"init",
	"migrate",
	"search",
	"explain",
	"clean",
	"daemon",
	"lsp-proxy",
]);
const passthroughOptions = new Set(["--help", "-h", "--version", "-V"]);

const resolvedArgs =
	args.length === 0
		? ["check", "."]
		: biomeCommands.has(args[0])
			? args
			: passthroughOptions.has(args[0])
				? args
				: args[0].startsWith("-")
					? ["check", ".", ...args]
					: ["check", ...args];

runPackageBin("@biomejs/biome", "biome", resolvedArgs);
