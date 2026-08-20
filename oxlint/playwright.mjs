import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";
import ultraciteVitest from "ultracite/oxlint/vitest";

import core from "./core.mjs";

const playwrightPluginSpecifier = import.meta
  .resolve("eslint-plugin-playwright");
const { "no-empty-pattern": _noEmptyPattern, ...recommendedPlaywrightRules } =
  playwright.configs["flat/recommended"].rules;

// A Playwright spec is not a Vitest file, so none of the Vitest rules belong on
// it. They land there anyway: Ultracite scopes them to `*.test.*`, `*.spec.*`
// and `__tests__`, which is how Playwright specs are named under either
// convention, and they are then reading a runner that is not there.
//
// `vitest/prefer-importing-vitest-globals` is the one that bites in practice.
// It matches on the *names* `expect` and `test` rather than on the import
// source, so it fires on a correctly imported Playwright `expect` and no call
// site can satisfy it — aliasing both imports silences it but blinds
// `sonarjs/no-empty-test-file`, which then reports the spec has no tests, which
// is a worse finding than the one it bought off.
// `vitest/consistent-test-filename` is the second: it demands `.spec.ts` be
// renamed to `.test.ts`. Playwright's own default `testMatch` accepts both, so
// this only conflicts in a repo whose config pins `.spec.ts` by name — real
// where it happens, and not the reason this exemption exists.
//
// This is a 2.0.0 regression, not an old defect. Before `df13eef` the core
// preset put `vitest` in its top-level `plugins` and named the rules at top
// level, where a later `"off"` entry could reach them. Moving to Ultracite's
// preset moved them into an override, and an override beats top level for the
// files it matches.
//
// Read out of Ultracite's own preset rather than listed here, so a Vitest rule
// added upstream is covered without this file being touched.
const vitestOverrides = ultraciteVitest.overrides ?? [];

const vitestFileGlobs = [
  ...new Set(vitestOverrides.flatMap((override) => override.files ?? [])),
];

export const vitestRulesOff = Object.fromEntries(
  vitestOverrides
    .flatMap((override) => Object.keys(override.rules ?? {}))
    .filter((ruleName) => ruleName.startsWith("vitest/"))
    .map((ruleName) => [ruleName, "off"])
);

// `vitest` has to be named wherever those `"off"` entries land. Oxlint resolves
// a rule entry against the plugin set in scope at that point, and `vitest` is
// absent from the core preset's top-level `plugins` — Ultracite enables it
// inside its own override. Omit this and every entry above is discarded in
// silence: measured as a no-op at top level, and in an override that carries
// the rules but not the plugin.
export const playwrightPlugins = ["vitest"];

export const playwrightJsPlugins = [
  { name: "playwright", specifier: playwrightPluginSpecifier },
];

export const playwrightRules = {
  ...recommendedPlaywrightRules,
  "playwright/no-element-handle": "error",
  "playwright/no-force-option": "error",
  "playwright/no-wait-for-timeout": "error",
  "playwright/prefer-web-first-assertions": "error",
};

// The overlay entry point. A consumer's E2E globs are its own, so the package
// cannot place this override itself — it hands back a complete entry instead of
// leaving the consumer to remember `plugins`, which is the part that silently
// does nothing when it is missing.
export const playwrightOverride = (files) => ({
  files,
  plugins: playwrightPlugins,
  rules: {
    ...vitestRulesOff,
    ...playwrightRules,
  },
});

export default defineConfig({
  extends: [core],
  jsPlugins: playwrightJsPlugins,
  // Standalone use: a dedicated E2E package has no Vitest tests, so the same
  // globs Ultracite scoped its rules to are exactly the files to exempt. The
  // Playwright rules stay at top level and keep covering every file in the
  // package, page objects and fixtures included.
  overrides: [
    {
      files: vitestFileGlobs,
      plugins: playwrightPlugins,
      rules: vitestRulesOff,
    },
  ],
  rules: playwrightRules,
});
