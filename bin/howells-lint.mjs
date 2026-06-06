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

const resolveBiomeArgs = (inputArgs) => {
  if (inputArgs.length === 0) {
    return ["check", "."];
  }

  const [firstArg] = inputArgs;
  if (biomeCommands.has(firstArg) || passthroughOptions.has(firstArg)) {
    return inputArgs;
  }

  if (firstArg.startsWith("-")) {
    return ["check", ".", ...inputArgs];
  }

  return ["check", ...inputArgs];
};

const resolvedArgs = resolveBiomeArgs(args);

runPackageBin("@biomejs/biome", "biome", resolvedArgs);
