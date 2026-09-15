#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";

const args = process.argv.slice(2);
const useDangerousFixes = args.includes("--unsafe");
const filteredArgs = args.filter((arg) => arg !== "--unsafe");
const { options: oxlintOptions, targets } = partitionOxlintArgs(filteredArgs);
const resolvedTargets = targets.length > 0 ? targets : ["."];

// Format first so the linter fixes clean input, but run both stages and report
// the first genuine failure rather than stopping after the formatter.
const formatStage = runStage(
  "oxfmt",
  "oxfmt",
  withOxfmtConfig(["--write", ...resolvedTargets])
);
const lintStage = runStage("oxlint", "oxlint", [
  useDangerousFixes ? "--fix-dangerously" : "--fix",
  ...oxlintOptions,
  ...resolvedTargets,
]);

exitFromStages("howells-fix", [formatStage, lintStage], targets);
