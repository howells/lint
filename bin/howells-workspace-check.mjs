#!/usr/bin/env node

import { handleManypkgMetadataCommand } from "./run-manypkg-command.mjs";
import { runPackageBin } from "./run-package-bin.mjs";
import { runWorkspacePreflight } from "./workspace-preflight.mjs";

const args = process.argv.slice(2);

if (handleManypkgMetadataCommand("check", args)) {
  process.exit(0);
}

const errors = runWorkspacePreflight();

if (errors.length > 0) {
  console.error("Workspace lint failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

runPackageBin("@manypkg/cli", "manypkg", ["check", ...args]);
