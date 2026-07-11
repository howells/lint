#!/usr/bin/env node

import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";
import { runPackageBin } from "./run-package-bin.mjs";

runPackageBin("oxfmt", "oxfmt", withOxfmtConfig(process.argv.slice(2)));
