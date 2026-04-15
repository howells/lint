#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

runPackageBin("ultracite", "ultracite", process.argv.slice(2));
