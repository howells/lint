#!/usr/bin/env node

import process from "node:process";

import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";
import { spawnPackageBin } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const useDangerousFixes = args.includes("--unsafe");
const filteredArgs = args.filter((arg) => arg !== "--unsafe");
const { options: oxlintOptions, targets } = partitionOxlintArgs(filteredArgs);
const resolvedTargets = targets.length > 0 ? targets : ["."];

// Format first so the linter fixes clean input, but run both stages and report
// the first failure rather than stopping after the formatter.
const run = (packageName, binName, commandArgs) => {
  const result = spawnPackageBin(packageName, binName, commandArgs);

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

const formatStatus = run(
  "oxfmt",
  "oxfmt",
  withOxfmtConfig(["--write", ...resolvedTargets])
);
const lintStatus = run("oxlint", "oxlint", [
  useDangerousFixes ? "--fix-dangerously" : "--fix",
  ...oxlintOptions,
  ...resolvedTargets,
]);

process.exit(formatStatus || lintStatus);
