import { defineConfig } from "oxlint";
import ultraciteCore from "ultracite/oxlint/core";

import { boundaryJsPlugins, boundaryRules } from "./boundaries.mjs";
import { ultraciteCoreJsPlugins } from "./ultracite-js-plugins.mjs";

export default defineConfig({
  extends: [ultraciteCore, ultraciteCoreJsPlugins],
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
  plugins: [...new Set([...(ultraciteCore.plugins ?? []), "vitest"])],
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
    "vitest/hoisted-apis-on-top": "error",
    "vitest/no-commented-out-tests": "error",
    "vitest/no-conditional-tests": "error",
    "vitest/no-disabled-tests": "error",
    "vitest/no-focused-tests": "error",
    "vitest/no-identical-title": "error",
    "vitest/no-import-node-test": "error",
    "vitest/no-mocks-import": "error",
    "vitest/no-standalone-expect": "error",
    "vitest/valid-describe-callback": "error",
    "vitest/valid-expect": "error",
    "vitest/valid-expect-in-promise": "error",
  },
});
