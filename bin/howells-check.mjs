#!/usr/bin/env node

import process from "node:process";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import { spawnPackageBin } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const { options: oxlintOptions, targets } = partitionOxlintArgs(args);
const resolvedTargets = targets.length > 0 ? targets : ["."];

// Run the formatter check and the linter unconditionally so a single pass
// surfaces every problem, then fail with the first non-zero status.
const run = (packageName, binName, commandArgs) => {
  const result = spawnPackageBin(packageName, binName, commandArgs);

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

const formatStatus = run("oxfmt", "oxfmt", ["--check", ...resolvedTargets]);
const lintStatus = run("oxlint", "oxlint", [...oxlintOptions, ...resolvedTargets]);

process.exit(formatStatus || lintStatus);
