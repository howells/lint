import { defineConfig } from "oxlint";
import ultraciteAntiSlop from "ultracite/oxlint/anti-slop";
import ultraciteCore from "ultracite/oxlint/core";
import ultraciteVitest from "ultracite/oxlint/vitest";

import { boundaryJsPlugins, boundaryRules } from "./boundaries.mjs";
import { ultraciteCoreJsPlugins } from "./ultracite-js-plugins.mjs";

// Anti-slop is extended last on purpose. It disables
// `typescript/consistent-indexed-object-style` and
// `unicorn/no-immediate-mutation`, which Ultracite's core preset enables and
// which deadlock against `anti-slop/no-known-value-widening` — the autofix of
// one produces the input of the other. Nothing after core turns them back on,
// so this position holds for the React and Next lanes too.
export default defineConfig({
  extends: [
    ultraciteCore,
    ultraciteCoreJsPlugins,
    ultraciteVitest,
    ultraciteAntiSlop,
  ],
  jsPlugins: boundaryJsPlugins,
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
      rules: {
        complexity: "off",
        "max-lines-per-function": "off",
        "max-statements": "off",
      },
    },
  ],
  plugins: ultraciteCore.plugins,
  rules: {
    ...boundaryRules,
    complexity: [
      "warn",
      {
        max: 15,
      },
    ],
    "max-lines": [
      "error",
      {
        max: 600,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    "max-lines-per-function": [
      "warn",
      {
        IIFEs: true,
        max: 120,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    "max-statements": [
      "warn",
      {
        max: 45,
      },
    ],
    "howells/no-runtime-dynamic-imports": "error",
    "no-restricted-properties": [
      "error",
      {
        message:
          "Use the project env schema instead of reading process.env directly. Env schema files may override this rule locally.",
        object: "process",
        property: "env",
      },
    ],
    "oxc/no-barrel-file": [
      "error",
      {
        threshold: 0,
      },
    ],
    // Ultracite enables both core `require-await` and typed
    // `typescript/promise-function-async`. Together they contradict: the typed
    // rule forces `async` onto every promise-returning function, and core
    // `require-await` then rejects any of them that has nothing to await — so a
    // no-await implementation of a promise-typed signature (test stubs,
    // passthrough adapters) is unwritable. The typed rule carries the intent
    // (promise-returning functions are async, never throw synchronously); the
    // untyped one yields.
    "require-await": "off",
    "unicorn/filename-case": [
      "error",
      {
        cases: {
          kebabCase: true,
        },
      },
    ],
  },
});
