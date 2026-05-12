#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

runPackageBin("oxfmt", "oxfmt", process.argv.slice(2));
