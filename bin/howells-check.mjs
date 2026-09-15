#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";
import { withOxlintConfig } from "./resolve-oxlint-config.mjs";

const args = process.argv.slice(2);
const { options: oxlintOptions, targets } = partitionOxlintArgs(args);
const resolvedTargets = targets.length > 0 ? targets : ["."];

// Run the formatter check and the linter unconditionally so a single pass
// surfaces every problem, then fail with the first genuine non-zero status. A
// path set that resolves to nothing after ignore rules passes: a check with
// nothing to check has found nothing wrong. See `empty-target-set.mjs`.
const formatStage = runStage(
  "oxfmt",
  "oxfmt",
  withOxfmtConfig(["--check", ...resolvedTargets])
);
const lintStage = runStage(
  "oxlint",
  "oxlint",
  withOxlintConfig([...oxlintOptions, ...resolvedTargets])
);

exitFromStages("howells-check", [formatStage, lintStage], targets);
