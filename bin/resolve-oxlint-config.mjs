import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// Oxlint discovers its own config, but only some spellings of it. Measured
// against the pinned Oxlint: `oxlint.config.ts` and `oxlint.config.mts` are
// found; `oxlint.config.cts`, `.js`, `.mjs` and `.cjs` are not. A project
// writing one of the latter gets no preset, no plugins and no rules, and the
// run is quiet and exits 0, so nothing announces that the config was never
// read. One consumer repo had 26 such files and had been linting on Oxlint's
// defaults throughout.
const explicitConfigPrefixes = ["--config=", "-c="];

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

function hasExplicitConfig(args) {
  return args.some(
    (arg) =>
      arg === "--config" ||
      arg === "-c" ||
      explicitConfigPrefixes.some((prefix) => arg.startsWith(prefix))
  );
}

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

export function withOxlintConfig(args, cwd = process.cwd()) {
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
}
