#!/usr/bin/env node

import { runManypkgCommand } from "./run-manypkg-command.mjs";

const args = process.argv.slice(2);
runManypkgCommand("fix", args);
