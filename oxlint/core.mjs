import { defineConfig } from "oxlint";
import ultraciteAntiSlop from "ultracite/oxlint/anti-slop";
import ultraciteCore from "ultracite/oxlint/core";
import ultraciteVitest from "ultracite/oxlint/vitest";

import { boundaryJsPlugins, boundaryRules } from "./boundaries.mjs";

// Anti-slop is extended last on purpose. It disables
// `typescript/consistent-indexed-object-style` and
// `unicorn/no-immediate-mutation`, which Ultracite's core preset enables and
// which deadlock against `anti-slop/no-known-value-widening` - the autofix of
// one produces the input of the other. Nothing after core turns them back on,
// so this position holds for the React and Next lanes too.
export default defineConfig({
  extends: [ultraciteCore, ultraciteVitest, ultraciteAntiSlop],
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
    // `vitest/prefer-to-be-truthy` and `vitest/prefer-to-be-falsy` autofix
    // `toBe(true)` to `toBeTruthy()` and `toBe(false)` to `toBeFalsy()`. Those
    // are not the same assertion: `toBe(true)` fails on the string "yes" and on
    // 1, and `toBeTruthy()` passes both. A test that pinned an exact boolean
    // comes out of the fixer accepting anything truthy, and because the rewrite
    // happens inside `howells-fix` it usually happens during a pre-commit hook,
    // where nobody reads the diff. Measured: 276 assertions rewritten in
    // colorscope, 121 in motif, one of which broke an env test.
    //
    // There is no way to keep the rule and drop its fix - Oxlint classes both
    // fixes as safe, so `--fix` applies them and only `--fix-dangerously` is
    // gated. Severity does not help either: motif had them at "warn" and the
    // fixer still rewrote its tests. So the rules are off, and `toBe(true)`
    // stays the assertion the author wrote.
    //
    // The file globs match Ultracite's own Vitest override, so the `__tests__`
    // and type-test spellings are covered too. `vitest` is named in `plugins`
    // because Oxlint resolves a rule entry against the plugin set in scope at
    // that point.
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.{ts,tsx,js,jsx}",
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
      ],
      plugins: ["vitest"],
      rules: {
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-to-be-truthy": "off",
      },
    },
    // `howells/no-runtime-dynamic-imports` and `vitest/prefer-import-in-mock`
    // contradict each other inside a test file. `prefer-import-in-mock` demands
    // that the module named in `vi.mock` be written as a dynamic import  -
    // "Substitute `./dep` with `import('./dep')`" - because that is what gives
    // the factory's `importOriginal()` its types. `no-runtime-dynamic-imports`
    // reports every `ImportExpression` there is. So a `vi.mock` call reports
    // under one rule or the other whichever way it is written, and neither
    // report is clearable. Measured on the 3.3.4 preset: the string form draws
    // `vitest(prefer-import-in-mock)`, and `vi.mock(import("./dep"), …)` draws
    // `howells(no-runtime-dynamic-imports)`.
    //
    // The dynamic-import ban exists to keep package loading traceable at
    // runtime, and a test file has no runtime to trace, so that rule is the one
    // that yields - and only here. Outside these globs it still holds, and
    // `prefer-import-in-mock` has nothing to say there because `vi.mock` is a
    // test-file construct. Both rules stay on and both are satisfiable.
    //
    // The globs match the Vitest override above, plus the setup files Vitest
    // loads before a suite, which may mock in the same way.
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.{ts,tsx,js,jsx}",
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
        "**/vitest.setup.{ts,tsx,js,jsx,mts,mjs}",
        "**/test/setup.{ts,tsx,js,jsx,mts,mjs}",
      ],
      rules: {
        "howells/no-runtime-dynamic-imports": "off",
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
    // `require-await` then rejects any of them that has nothing to await - so a
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
