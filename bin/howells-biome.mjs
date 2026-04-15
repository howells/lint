#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

runPackageBin("@biomejs/biome", "biome", process.argv.slice(2));
