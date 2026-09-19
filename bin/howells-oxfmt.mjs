#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import {
  warnOnShadowedOxfmtConfigs,
  withOxfmtConfig,
} from "./resolve-oxfmt-config.mjs";
import { spawnPackageBin } from "./run-package-bin.mjs";
import { hasStdinFlag } from "./stdin-mode.mjs";

const args = process.argv.slice(2);

// A stdin run reads the source from the parent's stdin and writes the formatted
// source to stdout, so it must bypass the capture path: `spawnPackageBinCapture`
// gives the child no stdin, and the caller got an empty string and exit 0 back.
// Nothing here inspects or classifies the output either - the bytes are the
// formatted file, and an empty path set cannot arise when there is no path.
if (hasStdinFlag(args)) {
  const result = spawnPackageBin("oxfmt", "oxfmt", withOxfmtConfig(args));

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} else {
  const { targets } = partitionOxlintArgs(args);

  if (args.some((arg) => arg === "--write" || arg === "-w")) {
    warnOnShadowedOxfmtConfigs(targets.length > 0 ? targets : ["."]);
  }

  // A path set that resolves to nothing after ignore rules is not a formatting
  // failure. See `empty-target-set.mjs` for why that matters in a pre-commit
  // hook.
  const stage = runStage("oxfmt", "oxfmt", withOxfmtConfig(args));

  exitFromStages("howells-oxfmt", [stage], targets);
}
