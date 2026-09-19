#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import {
  warnOnShadowedOxfmtConfigs,
  withOxfmtConfig,
} from "./resolve-oxfmt-config.mjs";

const args = process.argv.slice(2);
const { targets } = partitionOxlintArgs(args);

if (args.some((arg) => arg === "--write" || arg === "-w")) {
  warnOnShadowedOxfmtConfigs(targets.length > 0 ? targets : ["."]);
}

// A path set that resolves to nothing after ignore rules is not a formatting
// failure. See `empty-target-set.mjs` for why that matters in a pre-commit
// hook.
const stage = runStage("oxfmt", "oxfmt", withOxfmtConfig(args));

exitFromStages("howells-oxfmt", [stage], targets);
