#!/usr/bin/env node

import { globSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { exitFromStages, runStage } from "./empty-target-set.mjs";
import {
  isPatternTarget,
  oxlintExcludeArgs,
  partitionOxlintArgs,
  pathTargets,
} from "./parse-oxlint-args.mjs";
import {
  warnOnShadowedOxfmtConfigs,
  withOxfmtConfig,
} from "./resolve-oxfmt-config.mjs";
import { withOxlintConfig } from "./resolve-oxlint-config.mjs";

// A lint autofix is never applied to a test file. Oxlint calls a fix safe when
// it preserves the behaviour of the code it rewrites, but in a test the code is
// the assertion, so "same behaviour" is the wrong test: 3.3.4 had to turn
// `vitest/prefer-to-be-truthy` and `vitest/prefer-to-be-falsy` off outright
// because their safe fix turned `toBe(true)` into `toBeTruthy()` and loosened
// 397 assertions across two repos inside pre-commit hooks nobody read.
//
// That was one rule pair caught after the fact. The property that made it
// dangerous belongs to the file, not the rule: every consumer runs `howells-fix`
// from a pre-commit hook, so any fix landing in a test file lands unreviewed.
// So the whole class is excluded here rather than rule by rule in the preset.
// Test files are still linted - the second stage below reports on them - and
// oxfmt still formats them, because formatting moves whitespace and cannot
// change what an assertion asserts.
const TEST_FILE_GLOBS = ["**/*.test.*", "**/*.spec.*"];
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[^./\\]+$/u;

const isDirectory = (target) => {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
};

// The report-only stage needs the test files named explicitly, because there is
// no inverse of `--ignore-pattern` to say "these and nothing else".
const testFileTargets = (targets) => {
  const found = new Set();

  for (const target of targets) {
    // A pattern is not a path to walk, and an exclude must not become a target.
    if (isPatternTarget(target)) {
      continue;
    }

    if (!isDirectory(target)) {
      if (TEST_FILE_PATTERN.test(target)) {
        found.add(target);
      }
      continue;
    }

    const matches = globSync(TEST_FILE_GLOBS, {
      cwd: target,
      exclude: (candidate) => candidate.includes("node_modules"),
    });

    for (const match of matches) {
      found.add(path.join(target, match));
    }
  }

  return [...found];
};

const args = process.argv.slice(2);
const useDangerousFixes = args.includes("--unsafe");
const filteredArgs = args.filter((arg) => arg !== "--unsafe");
const { options: oxlintOptions, targets } = partitionOxlintArgs(filteredArgs);
const resolvedTargets = targets.length > 0 ? targets : ["."];
const testTargets = testFileTargets(resolvedTargets);

warnOnShadowedOxfmtConfigs(resolvedTargets);

// Format first so the linter fixes clean input, but run both stages and report
// the first genuine failure rather than stopping after the formatter.
const formatStage = runStage(
  "oxfmt",
  "oxfmt",
  withOxfmtConfig(["--write", ...resolvedTargets])
);
const lintFixStage = runStage(
  "oxlint",
  "oxlint",
  withOxlintConfig([
    useDangerousFixes ? "--fix-dangerously" : "--fix",
    ...TEST_FILE_GLOBS.flatMap((glob) => ["--ignore-pattern", glob]),
    ...oxlintExcludeArgs(resolvedTargets),
    ...oxlintOptions,
    ...pathTargets(resolvedTargets),
  ])
);
const stages = [formatStage, lintFixStage];

if (testTargets.length > 0) {
  stages.push(
    runStage(
      "oxlint",
      "oxlint",
      withOxlintConfig([
        ...oxlintExcludeArgs(resolvedTargets),
        ...oxlintOptions,
        ...testTargets,
      ])
    )
  );
}

exitFromStages("howells-fix", stages, targets);
