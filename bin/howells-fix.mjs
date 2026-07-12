#!/usr/bin/env node

import { existsSync } from "node:fs";
import process from "node:process";

import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";
import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";
import { spawnPackageBinCapture } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const useDangerousFixes = args.includes("--unsafe");
const filteredArgs = args.filter((arg) => arg !== "--unsafe");
const { options: oxlintOptions, targets } = partitionOxlintArgs(filteredArgs);
const resolvedTargets = targets.length > 0 ? targets : ["."];

// Messages the tools print when the resolved path set is empty after ignore
// rules — a JSON/lockfile/config-only commit, say. That is "nothing to fix",
// not a lint failure, so it must not fail a fixer.
const EMPTY_SET_SIGNALS = [
  "No files found to lint", // oxlint
  "Expected at least one target file", // oxfmt
];

// An explicitly-named path that does not exist on disk is a genuine user error
// (a typo), distinct from a path that exists but holds nothing lintable. Only
// the former should fail the fixer.
const missingExplicitTargets = targets.filter((target) => !existsSync(target));

const emit = (result) => {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
};

// Classify a finished stage: "ok" (exit 0), "empty" (non-zero only because the
// path set resolved to nothing), or "fail" (a real non-zero to surface).
const classify = (result) => {
  if ((result.status ?? 1) === 0) {
    return "ok";
  }

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (EMPTY_SET_SIGNALS.some((signal) => output.includes(signal))) {
    return "empty";
  }

  return "fail";
};

const run = (packageName, binName, commandArgs) => {
  const result = spawnPackageBinCapture(packageName, binName, commandArgs);

  if (result.error) {
    throw result.error;
  }

  emit(result);

  return { status: result.status ?? 1, kind: classify(result) };
};

// Format first so the linter fixes clean input, but run both stages and report
// the first genuine failure rather than stopping after the formatter.
const formatResult = run(
  "oxfmt",
  "oxfmt",
  withOxfmtConfig(["--write", ...resolvedTargets])
);
const lintResult = run("oxlint", "oxlint", [
  useDangerousFixes ? "--fix-dangerously" : "--fix",
  ...oxlintOptions,
  ...resolvedTargets,
]);

// A path the caller named that isn't on disk is a real error: surface it.
if (missingExplicitTargets.length > 0) {
  console.error(
    `howells-fix: no such path(s): ${missingExplicitTargets.join(", ")}`
  );
  process.exit(formatResult.status || lintResult.status || 1);
}

// A genuine formatter or linter failure still fails the fixer.
if (formatResult.kind === "fail" || lintResult.kind === "fail") {
  process.exit(formatResult.status || lintResult.status || 1);
}

// Everything that ran was either clean or resolved to an empty path set. An
// empty set is success for a fixer — there was simply nothing to fix.
if (formatResult.kind === "empty" || lintResult.kind === "empty") {
  console.log(
    "howells-fix: no lintable files in the given paths — nothing to fix."
  );
}

process.exit(0);
