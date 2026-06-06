#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

const targets = process.argv.slice(2);
const args = targets.length > 0 ? ["check", "--write", ...targets] : ["check", "--write", "."];

runPackageBin("@biomejs/biome", "biome", args);
