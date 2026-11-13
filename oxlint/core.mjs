import { defineConfig } from "oxlint";
import ultraciteAntiSlop from "ultracite/oxlint/anti-slop";
import ultraciteCore from "ultracite/oxlint/core";
import ultraciteVitest from "ultracite/oxlint/vitest";

import { boundaryJsPlugins, boundaryRules } from "./boundaries.mjs";
import gdp from "./gdp.mjs";
import { testFileGlobs } from "./test-files.mjs";

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
  // One override for test files, on the globs in `test-files.mjs`. `vitest` is
  // named in `plugins` because Oxlint drops a rule entry whose plugin is not in
  // scope at that point.
  overrides: [
    {
      files: testFileGlobs,
      plugins: ["vitest"],
      rules: {
        // A suite is one long callback; size limits measure nothing there.
        complexity: "off",
        "max-lines-per-function": "off",
        "max-statements": "off",
        // `vitest/prefer-import-in-mock` requires `vi.mock(import("./dep"))`,
        // which the dynamic-import ban rejects for a package. The ban exists
        // to keep runtime loading traceable, so it yields in tests.
        "howells/no-runtime-dynamic-imports": "off",
        // Vitest deliberately returns `any` from asymmetric matchers:
        // https://github.com/vitest-dev/vitest/pull/8129
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-member-access": "off",
        // The autofix turns `toBe(true)` into `toBeTruthy()`, which also
        // passes "yes" and 1. Oxlint classes the fix as safe, so `--fix`
        // applies it at any severity; off is the only way to keep the exact
        // assertion. Measured: 276 assertions rewritten in colorscope, 121 in
        // motif, one of which broke an env test.
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-to-be-truthy": "off",
        // Native support covers literal messages; variables need maxArgs: 2.
        "vitest/valid-expect": ["error", { maxArgs: 2 }],
      },
    },
  ],
  plugins: ultraciteCore.plugins,
  rules: {
    ...boundaryRules,
    // Preserve declaration merging when enforcing object declaration style.
    "typescript/consistent-type-definitions": "off",
    "howells/consistent-type-definitions": "error",
    // Schema and geometry names use "shape" as a domain term. A substring
    // check cannot distinguish those contracts from a vague structural name.
    "anti-slop/no-shape-in-symbol-names": "off",
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
    // The native fix rewrites `fileURLToPath(import.meta.url)` to
    // `import.meta.filename`, which bundlers leave undefined.
    "unicorn/prefer-import-meta-properties": "off",
    // A fixed relative specifier keeps a deferred chunk traceable. Package and
    // computed specifiers still report.
    "howells/no-runtime-dynamic-imports": [
      "error",
      { allowLocalModules: true },
    ],
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
    // Callback APIs need Promise constructors in browsers that support Next
    // but not Promise.withResolvers. Keep executor-safety checks enabled.
    "promise/avoid-new": "off",
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
