import { existsSync } from "node:fs";
import process from "node:process";

import { spawnPackageBinCapture } from "./run-package-bin.mjs";

// Messages the tools print when the resolved path set is empty after ignore
// rules — a JSON/lockfile/config-only commit, say, or a regenerate-only commit
// touching nothing but generated data. Neither tool found anything wrong; both
// found nothing to look at. That must not fail a command.
//
// This bites hardest in a pre-commit hook, where the staged set is whatever the
// commit happens to touch. A repo whose data bakes produce commits of generated
// JSON could not commit at all without `--no-verify`, which switches off every
// other check too.
export const EMPTY_SET_SIGNALS = [
  "No files found to lint", // oxlint
  "Expected at least one target file", // oxfmt
];

export const emit = (result) => {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
};

// Classify a finished stage: "ok" (exit 0), "empty" (non-zero only because the
// path set resolved to nothing), or "fail" (a real non-zero to surface).
export const classify = (result) => {
  if ((result.status ?? 1) === 0) {
    return "ok";
  }

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (EMPTY_SET_SIGNALS.some((signal) => output.includes(signal))) {
    return "empty";
  }

  return "fail";
};

// An explicitly-named path that does not exist on disk is a genuine user error
// (a typo), distinct from a path that exists but holds nothing lintable. Only
// the former should fail the command.
export const missingTargets = (targets) =>
  targets.filter((target) => !existsSync(target));

export const runStage = (packageName, binName, commandArgs) => {
  const result = spawnPackageBinCapture(packageName, binName, commandArgs);

  if (result.error) {
    throw result.error;
  }

  emit(result);

  return { kind: classify(result), status: result.status ?? 1 };
};

// The shared exit path for every binary here. A named path that is not on disk
// fails; a genuine tool failure fails; an empty path set says so on stdout and
// succeeds, so a hook or a CI step is never blocked by having nothing to do.
//
// `process.exitCode` rather than `process.exit()`. These commands capture each
// tool's output and re-emit it, and a write to a pipe is asynchronous, so
// `process.exit()` discards whatever has not drained — measured at a 64KB
// truncation, and in practice it dropped Oxlint's findings entirely while
// keeping Oxfmt's. Oxlint writes findings to stderr, so the loss was silent and
// the command still reported the right status. Setting the code and returning
// lets Node flush both streams before it exits.
export const exitFromStages = (commandName, stages, targets = []) => {
  const missing = missingTargets(targets);
  const firstStatus = stages.find((stage) => stage.status !== 0)?.status ?? 0;

  if (missing.length > 0) {
    console.error(`${commandName}: no such path(s): ${missing.join(", ")}`);
    process.exitCode = firstStatus || 1;
    return;
  }

  if (stages.some((stage) => stage.kind === "fail")) {
    process.exitCode = firstStatus || 1;
    return;
  }

  if (stages.some((stage) => stage.kind === "empty")) {
    console.log(
      `${commandName}: no lintable files in the given paths — nothing to do.`
    );
  }

  process.exitCode = 0;
};
