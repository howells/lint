#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import {
  partitionOxlintArgs,
  withOxlintExcludes,
} from "./parse-oxlint-args.mjs";
import { withOxlintConfig } from "./resolve-oxlint-config.mjs";
import { hasStdinFlag, refuseStdin } from "./stdin-mode.mjs";

const args = process.argv.slice(2);

// Oxlint 1.82.0 has no stdin mode, so a stdin request cannot be served here.
if (hasStdinFlag(args, ["--stdin-filepath", "--stdin"])) {
  refuseStdin("howells-oxlint");
  process.exit(2);
}

const { targets } = partitionOxlintArgs(args);

// A path set that resolves to nothing after ignore rules is not a lint failure.
// See `empty-target-set.mjs` for why that matters in a pre-commit hook.
const stage = runStage(
  "oxlint",
  "oxlint",
  withOxlintConfig(withOxlintExcludes(args))
);

exitFromStages("howells-oxlint", [stage], targets);
