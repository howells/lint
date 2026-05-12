#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

runPackageBin("oxlint", "oxlint", process.argv.slice(2));
