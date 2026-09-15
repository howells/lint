#!/usr/bin/env node

import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";

const args = process.argv.slice(2);
const { targets } = partitionOxlintArgs(args);

// A path set that resolves to nothing after ignore rules is not a lint failure.
// See `empty-target-set.mjs` for why that matters in a pre-commit hook.
const stage = runStage("oxlint", "oxlint", args);

exitFromStages("howells-oxlint", [stage], targets);
