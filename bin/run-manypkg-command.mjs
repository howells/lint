#!/usr/bin/env node

import { createRequire } from "node:module";

import { runPackageBin } from "./run-package-bin.mjs";

const require = createRequire(import.meta.url);
const helpOptions = new Set(["--help", "-h"]);
const versionOptions = new Set(["--version", "-V"]);

export const printManypkgCommandHelp = (command) => {
  console.log(`Usage: howells-workspace-${command} [options]\n`);
  console.log(`Runs: manypkg ${command} [options]`);
};

export const printManypkgCliVersion = () => {
  const { version } = require("@manypkg/cli/package.json");
  console.log(version);
};

export const handleManypkgMetadataCommand = (command, args) => {
  if (helpOptions.has(args[0])) {
    printManypkgCommandHelp(command);
    return true;
  }

  if (versionOptions.has(args[0])) {
    printManypkgCliVersion();
    return true;
  }

  return false;
};

export const runManypkgCommand = (command, args) => {
  if (handleManypkgMetadataCommand(command, args)) {
    process.exit(0);
  }

  runPackageBin("@manypkg/cli", "manypkg", [command, ...args]);
};
