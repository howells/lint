import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { ignorePatterns } from "../oxlint/ignore-patterns.mjs";
import { explicitConfigPath, hasExplicitConfig } from "./target-args.mjs";

// Oxlint discovers its own config, but only some spellings of it. Measured
// against the pinned Oxlint: `oxlint.config.ts` and `oxlint.config.mts` are
// found; `oxlint.config.cts`, `.js`, `.mjs` and `.cjs` are not. A project
// writing one of the latter gets no preset, no plugins and no rules, and the
// run is quiet and exits 0, so nothing announces that the config was never
// read. One consumer repo had 26 such files and had been linting on Oxlint's
// defaults throughout.

// Spellings Oxlint finds on its own. Leave these alone: Oxlint also applies a
// nested config to the directory it sits in, and passing `--config` pins one
// config for the whole run, which would silently flatten a monorepo where each
// package configures itself. Measured: a nested `no-debugger: "off"` is
// honoured with no flag and overridden with one.
const autoDiscoveredProjectNames = ["oxlint.config.ts", "oxlint.config.mts"];

// Spellings Oxlint ignores. These need the flag, and the flag costs nested
// discovery, so the warning points at the rename that restores it.
const flagRequiredProjectNames = [
  "oxlint.config.cts",
  "oxlint.config.js",
  "oxlint.config.mjs",
  "oxlint.config.cjs",
];

const autoDiscoveredRcNames = [".oxlintrc.json", ".oxlintrc.jsonc"];

// Walk up from the cwd and report the first config of any kind. Whichever
// comes first wins, so a directory holding both an auto-discovered spelling
// and an ignored one is left to Oxlint rather than second-guessed.
export function findOxlintConfig(cwd = process.cwd()) {
  let directory = path.resolve(cwd);

  for (;;) {
    const names = [
      ...autoDiscoveredProjectNames,
      ...flagRequiredProjectNames,
      ...autoDiscoveredRcNames,
    ];
    const found = names.find((name) => existsSync(path.join(directory, name)));

    if (found) {
      return {
        name: found,
        path: path.join(directory, found),
        requiresFlag: flagRequiredProjectNames.includes(found),
      };
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

// There is no packaged fallback here, unlike the Oxfmt side. A project with no
// config at all keeps Oxlint's defaults; quietly imposing a preset on it would
// be a larger change than the one this fixes. It does get told, though: a
// sweep of one machine on 2026-09-16 found ten repos depending on this package
// with no oxlint config anywhere, each linting on the defaults and each
// looking, from its green `pnpm lint`, exactly like a repo on the preset.
export const noConfigWarning =
  "No oxlint.config.ts found in this directory or any parent, so this run uses Oxlint's defaults and no @howells/lint preset applies. Add an oxlint.config.ts that extends @howells/lint/oxlint/core, react or next.";

// Oxlint drops a preset's `ignorePatterns` when the preset arrives through
// `extends`, so build output and generated files would be linted unless every
// consumer copied the list into its own config. Passing it here makes the bins
// honour it for a config that says nothing about ignores.
//
// Each pattern is passed twice. As a flag, `**/dist` stops a directory walk but
// not a file inside it named on the command line, which is how lint-staged
// calls the bins; `**/dist/**` covers that file.
const presetIgnoreFlags = ignorePatterns.flatMap((pattern) => [
  "--ignore-pattern",
  pattern,
  "--ignore-pattern",
  `${pattern}/**`,
]);

// A config that sets `ignorePatterns` owns its list. A flag cannot be undone
// from a config, so passing the preset's list over it would hide source the
// repo chose to lint - a `src/build/` directory, say - with no way back.
const ownsIgnorePatterns = (configPath) =>
  existsSync(configPath) &&
  /\bignorePatterns\b/u.test(readFileSync(configPath, "utf8"));

export const presetIgnoreArgs = (args, cwd = process.cwd()) => {
  const configPath = explicitConfigPath(args) ?? findOxlintConfig(cwd)?.path;
  return configPath && ownsIgnorePatterns(path.resolve(cwd, configPath))
    ? []
    : presetIgnoreFlags;
};

const withProjectConfig = (args, cwd) => {
  if (hasExplicitConfig(args)) {
    return args;
  }

  const config = findOxlintConfig(cwd);
  if (!config) {
    console.error(noConfigWarning);
    return args;
  }
  if (!config.requiresFlag) {
    return args;
  }

  console.error(
    `${config.name} is not a spelling Oxlint discovers on its own, so it is being passed with --config. Rename it to oxlint.config.ts: a pinned config applies to the whole run, which overrides any nested config a package of its own.`
  );

  return ["--config", config.path, ...args];
};

export const withOxlintConfig = (args, cwd = process.cwd()) => [
  ...presetIgnoreArgs(args, cwd),
  ...withProjectConfig(args, cwd),
];
