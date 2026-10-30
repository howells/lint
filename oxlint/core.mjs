import { defineConfig } from "oxlint";
import ultraciteAntiSlop from "ultracite/oxlint/anti-slop";
import ultraciteCore from "ultracite/oxlint/core";
import ultraciteVitest from "ultracite/oxlint/vitest";

import { boundaryJsPlugins, boundaryRules } from "./boundaries.mjs";
import gdp from "./gdp.mjs";

// Oxlint only reads ignores from the consumer's root config, not `extends`.
// Consumers spread this export into their own ignorePatterns; see MIGRATIONS.md.
export const ignorePatterns = [
  ...ultraciteCore.ignorePatterns,
  "**/generated/**",
];

// Anti-slop is extended last on purpose. It disables
// `typescript/consistent-indexed-object-style` and
// `unicorn/no-immediate-mutation`, which Ultracite's core preset enables and
// which deadlock against `anti-slop/no-known-value-widening` - the autofix of
// one produces the input of the other. Nothing after core turns them back on,
// so this position holds for the React and Next lanes too.
export default defineConfig({
  extends: [ultraciteCore, ultraciteVitest, gdp, ultraciteAntiSlop],
  ignorePatterns,
  jsPlugins: boundaryJsPlugins,
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.*",
        "**/__tests__/**",
        "**/vitest.setup.{ts,tsx,js,jsx,mts,mjs}",
        "**/test/setup.{ts,tsx,js,jsx,mts,mjs}",
      ],
      plugins: ["vitest"],
      rules: {
        // Vitest deliberately returns `any` from asymmetric matchers:
        // https://github.com/vitest-dev/vitest/pull/8129
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-member-access": "off",
        // Native support covers literal messages; variables need maxArgs: 2.
        "vitest/valid-expect": ["error", { maxArgs: 2 }],
      },
    },
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
    // A command-line script that awaits inside a loop usually means it: one
    // request at a time for a rate-limited API, or one local process at a time
    // (a model CLI, ffmpeg) where running them all at once would swamp the
    // machine. There is no restructure that keeps that sequence and satisfies
    // `no-await-in-loop` - recursion and reduce-chained promises only hide the
    // loop from the rule. Measured in kinecho: `scripts/classify.ts` runs the
    // local Claude CLI once per video, by design. Application code keeps the
    // rule, where an awaited loop is the usual accidental serialisation.
    {
      files: ["**/scripts/**/*.{ts,mts,js,mjs}"],
      rules: {
        "no-await-in-loop": "off",
      },
    },
    // A tool's own config file runs inside that tool, not the app: Playwright
    // reads `process.env.CI` to set retries and workers, Vitest and Drizzle read
    // their own variables. The app's env schema neither covers nor should cover
    // those, so the env rule has nothing to point the config at.
    {
      files: ["**/{playwright,vitest,vite,drizzle}.config.{ts,mts,js,mjs,cjs}"],
      rules: {
        "no-restricted-properties": "off",
      },
    },
  ],
  plugins: ultraciteCore.plugins,
  rules: {
    ...boundaryRules,
    // Oxlint's option names differ from typescript-eslint's override option.
    "class-methods-use-this": [
      "error",
      { ignoreClassesWithImplements: "all", ignoreOverrideMethods: true },
    ],
    complexity: [
      "warn",
      {
        max: 15,
      },
    ],
    // Follow xo: typed exhaustiveness handles unions and open types together.
    // https://github.com/xojs/eslint-config-xo-typescript/blob/main/index.js
    "default-case": "off",
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
    "howells/require-disable-reason": "error",
    // `no-bitwise` exists to catch `&` or `|` typed for `&&` or `||`. In
    // TypeScript that mistake is already a compile error (TS2447: the operator
    // is not allowed for boolean types), so the rule only ever reports code
    // that means its bitwise operators: FNV-1a and other hashes, unsigned
    // 32-bit folds, and TypeScript's own SymbolFlags. Measured across the
    // repos on this preset: six suppressed it, by config in designmilk and
    // materialdesk, as a legacy warning in materialgraph, and inline in
    // colorscope, setout, materia and materialdesk scripts. Every inline
    // suppression was a hash or a TypeScript flags mask.
    "no-bitwise": "off",
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
    "typescript/switch-exhaustiveness-check": [
      "error",
      {
        allowDefaultCaseForExhaustiveSwitch: false,
        requireDefaultForNonUnion: true,
      },
    ],
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
