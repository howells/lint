# Adoption Notes

Use these notes when replacing an existing ESLint, Prettier, Biome, or ad hoc Oxlint/Oxfmt setup with `@howells/lint`.

## 3.9.2: applicability corrections and browser compatibility

These notes describe the unreleased policy. Version 3.9.1 remains the published release; publication of 3.9.2 requires approval. The changes are not certification that any consumer has reached zero findings or preserved its complete behavior.

### Node stream operator options

Core, React, Next and standalone Playwright replace native `unicorn/no-array-method-this-argument` with `howells/no-array-method-this-argument`. Node's `Readable.map(callback, options)` uses the second argument for concurrency and cancellation, not an array `thisArg`. Keep the API, option values, order and error behavior intact:

```ts
import { Readable } from "node:stream";

const shards = Readable.from(indices).map(readShard, { concurrency: 4 });
```

The counterpart retains the pinned native candidate matcher, callback filtering and library exclusions. Its exemption covers only `every`, `filter`, `find`, `flatMap`, `forEach`, `map` and `some` directly on a proven `Readable.from(...)` result. The constructor must resolve lexically to a value import of `Readable`, or default/namespace `.Readable`, from `node:stream` or `stream`. Imported local names are resolved by binding identity; no spelling or options-object heuristic establishes a stream.

Shadows, type-only or foreign imports, stream variables, subclasses and chains remain unproved and retain native findings. A detected use of any runtime stream import beyond a direct factory invocation invalidates the exemption for that file, including constructor/prototype mutation, aliases, reflection, re-exports and escaping references. Alternative detected module access through `require`, `import()` or `getBuiltinModule` also invalidates it. This is a file-local proof under standard Node builtins, not whole-program monkeypatch analysis. Neither the counterpart nor the native rule offers fixes or suggestions.

No consumer disable or source rewrite is needed for the proven stream form. Move an explicit array-rule preference to `howells/no-array-method-this-argument` when adopting the shared behavior. The original native key remains a normal explicit opt-in and retains its stream report if intentionally enabled.

### Deferred local modules

`howells/no-runtime-dynamic-imports` adds `{ allowLocalModules: true }`. The plugin option defaults to false, retaining the blanket ban and diagnostic for standalone users. Core enables it, inherited by React, Next and standalone Playwright. Existing test-file exemptions remain.

An accepted import is a fixed relative **string literal** resolving to an existing JavaScript/TypeScript file owned by the same package, for example `await import("./generated-schemes.ts")`. This preserves deferred corpus evaluation and local code splitting without hiding package dependencies. There is no autofix; replacing the import with a static import can change module evaluation and SDK import costs.

The rule resolves relative specifiers as module URLs, then checks real files and the nearest valid `package.json` for both source and target. It rejects workspace/package escapes, nested package boundaries, `node_modules`, symlink redirects, missing files/manifests and invalid metadata. Conventional `apps/*` and `packages/*` directories without their own manifest cannot borrow the root package's ownership. Extension and directory searching are not performed.

The target's transitive runtime graph must be statically traceable and acyclic. Static ESM imports/re-exports may resolve installed packages; their actual source files are traversed too. No external package is an opaque safe leaf. Relative edges must stay inside their own real package, including in dependencies. Bare package exports and package `imports` aliases are resolved to actual files, so they cannot conceal a back edge or self-import into owned workspace code. Explicit TypeScript type-only edges do not load code.

The existing pinned Oxc resolver checks Node and browser profiles, each with default, development and production conditions. ESM edges use `import` conditions; CommonJS edges use `require`. Browser imports also check the `module` condition, `browser`/`module`/`main` entry fields and `browser` aliases; browser requires use `browser`/`main`. Every profile must pass independently. Package files and canonical CommonJS relative edges may use resolver extension/directory searching. The initial deferred target and owned relative ESM edges still require explicit existing files. Fixed valid JSON and CSS without stylesheet imports or escapes are asset leaves; unsupported formats, unresolved/ignored aliases, parse failures and unknown loading keep the finding.

CommonJS loading is supported only in actual CommonJS files: `.cjs`/`.cts`, or files owned by a package without `"type": "module"`, with no runtime ESM syntax. A binding merely spelled `require` in a module does not qualify. Supported calls have one fixed, unescaped literal dependency argument and use the unshadowed wrapper `require` or `module.require`. The latter can supply its receiver through `.call(module, literal)` and a `module && module.require` guard. A computed member key must prove the exact string `"require"`: a literal/concatenation, or a single initialized local binding with no other uses or writes in the same execution block. A known string prefix can survive concatenation with an unknown suffix and a bounded literal `.slice(start, end)` selecting only known characters. The proof uses JavaScript UTF-16 indices and never evaluates or trusts the suffix's value; the suffix's syntax still undergoes loading analysis. Nonliteral, negative, reversed or out-of-range endpoints, mutable/shadowed/escaping keys, wrong receivers and detected relevant intrinsic access or escape invalidate that inference. This accounts for a literal dependency behind that syntax; it never admits a computed dependency argument.

Loader aliases and escapes remain unproved, including `const load = require`, CommonJS wrapper `arguments`, extracted `module.require`, created loaders and factory aliases. Runtime imports/re-exports or requires of `module`/`node:module` and `vm`/`node:vm`, detected `createRequire`/`getBuiltinModule` access and dynamic evaluators also prevent the allowance. Namespace/default access and destructuring cannot hide those APIs. Literal destructuring keys use their decoded names, including quoted and computed literals; unknown computed keys remain unproved. Aliases, rest captures and unknown computed access to `process`, `globalThis` and `global` namespaces prevent the allowance, as do default/namespace `process` imports or CommonJS process-namespace requires. Direct fixed property reads, `typeof` checks, fixed non-loader destructuring and named process utilities remain supported. Keep the deferred import finding when the loader cannot be modeled; moving evaluation into an eager import can change product behavior.

This is a conservative syntactic loading-graph contract under standard module loaders and runtime intrinsics, with immutable files for one lint context. It is not whole-program evaluator or monkeypatch analysis, a proof of arbitrary custom resolver conditions/hooks, compiler-injected edges, bundler transforms or browser compatibility. Filesystem, parser and resolver caches are context-local, so a later lint rechecks changed source, manifests and symlinks. The proof uses the already pinned Oxc parser and resolver; no dependency, compiler or ESLint engine is added. It covers Oxlint 1.86's omission of dynamic edges from `import/no-cycle` and `import/no-self-import`; those native rules remain enabled.

Templates, including those without substitutions, escaped literal spellings, percent-encoded specifiers, backslashes, control characters, query strings and fragments remain reported. Existing boundary analyzers consume raw string specifiers, so the allowance requires the same path interpretation in those analyzers and the module loader. Package and computed `import()` expressions remain rejected, and feature-layer/workspace/dependency rules continue to apply. No file allowlist, wrapper or consumer rule cut is needed. Keep literal dependencies and generated targets available on disk; if ownership or the graph cannot be proved, use the finding to resolve that uncertainty rather than widening the policy locally.

### Callback-to-Promise bridges

Core, React, Next and standalone Playwright no longer enable `promise/avoid-new`. Browser event, timer and message callbacks can use `new Promise` directly. The blanket constructor ban pushed those bridges toward `Promise.withResolvers`, which is absent from some browsers in Next's default support range. A Node engine pin does not establish browser API support, and syntax compilation does not provide missing runtime APIs.

This permits Promise constructors generally; it does not classify whether a particular constructor is necessary. Prefer an existing promise when one is available. Keep executors synchronous and clean up timers and event listeners. Executor safety and Promise correctness rules remain enabled, including `no-async-promise-executor`, `no-promise-executor-return`, `promise/no-multiple-resolved` and typed floating/misused-promise checks. No consumer rule cut or deferred helper is needed for a legitimate callback bridge.

### Declaration style and explicit augmentations

Core, React, Next and standalone Playwright replace `typescript/consistent-type-definitions` with `howells/consistent-type-definitions`, preserving the default `"interface"` preference. The existing Howells plugin carries the rule. Ordinary object declarations, namespaces and new ambient declarations in script declaration files remain checked.

In `"type"` mode, interfaces inside an explicit global or string-literal module augmentation remain interfaces so declaration merging keeps working. Import, export or `import.meta` syntax establishes the external module context. Native autofixes changed valid React CSS properties and table metadata augmentations into aliases that failed compilation; the shared rule leaves those merge contracts intact.

Move any explicit preference to the new rule key, keeping its value. For example, a project that already prefers aliases uses:

```ts
rules: {
  "howells/consistent-type-definitions": ["error", "type"],
}
```

Replace the old key instead of keeping both: an explicit native `"type"` preference would contradict the shared counterpart's default `"interface"` preference. The native rule is replaced centrally; a consumer disable is unnecessary.

Module classification is deliberately limited. The parser's module flag does not establish TypeScript's external-module status under forced or NodeNext detection. Implicit or ambiguous augmentation contexts still report the preference finding, but receive no potentially destructive fix. Full implicit-module support requires compiler context. Do not add artificial module markers to evade the diagnostic. Fixes also withhold a rewrite that would discard a comment; the finding remains for a manual edit that preserves it.

### Portable module paths

Core, React, Next and standalone Playwright replace `unicorn/prefer-import-meta-properties` with `howells/prefer-supported-import-meta-properties`. The existing Howells plugin carries the rule; no new dependency or plugin entry is needed.

An enclosing string check must establish the particular native path property before the rule prefers it. Node engine support alone cannot establish that a bundler supplies `import.meta.dirname` or `import.meta.filename`. Unguarded portable URL resolution and absent-property fallback branches stay valid. A dirname check does not establish filename availability.

Keep an existing portable calculation. A module that deliberately prefers a native property while remaining portable can also write its actual capability fallback directly:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const here =
  import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
```

The rule still reports supported filename and dirname constructions, resolves Node helper bindings and proven initialized constant aliases, and avoids fixes across mutation, escape or initialization boundaries. An alias initializer must precede its use in the same execution block or switch case; text order alone does not prove initialization across a deferred function or another case. Possible module-object aliases still invalidate mutation and escape proofs when that initialization cannot be established. Unknown method calls on known builtin and runtime receivers invalidate the proof: a method can mutate its receiver, return its identity through `valueOf`, or expose it through `bind`. Modeled path helpers, builtin lookup, URL parsing, zero-argument URL string conversions and literal-name getter/setter lookups whose result is discarded or inspected with `typeof` remain valid. Using or escaping a retrieved accessor invalidates the proof. Harmless property reads remain valid too. Local constant exemptions apply only to bindings the alias resolver can trace. Quoted computed fields can be traced for hazards without expanding positive matches; unresolved computed, defaulted, nested and rest bindings invalidate the proof. Unknown computed writes to `process` or `globalThis` also invalidate the proof; computed identifiers and nonstring member keys are not known unrelated property names. Direct, destructuring and loop-target writes invalidate the proof; default initializers, computed pattern keys and loop iterables remain reads. An interior comment is retained by reporting without autofix. URL-directory conversions such as `fileURLToPath(new URL(".", import.meta.url))` keep their trailing separator; bare `import.meta.dirname` is not an equivalent string.

The proof is deliberately local. Deferred function bodies, custom predicate functions, early-return dominance and computed property guards are not inferred. Escaping runtime globals, including their use through known global aliases, Node process imports and mutable URL prototypes exposed by Node URL imports, prevent a local replacement proof. Computed or chained prototype access remains a possible escape. URL instances retain their constructor identity through simple local constant aliases and recognized decoding; exporting them or passing them to unmodeled callers prevents that proof. Extracting the builtin lookup function also prevents it. Calls or escapes of known dynamic evaluators (`eval`, `Function` and Node VM APIs), including indirect and aliased access, prevent the proof. Constructor properties and unresolved computed values may expose function constructors; invoking or escaping them also prevents the proof. URL constructors, their prototypes and their instances retain distinct identities. Calls or escapes of Node module-loader APIs and runtime imports prevent the proof too; the independent runtime-import ban remains enabled. Hazard analysis follows optional chains, transparent TypeScript expressions and nested builtin objects, including namespace defaults, path variants and their subpath imports, without extending positive fixes to those expressions. Other runtime-validation rules still apply; do not add an artificial guard or helper solely to satisfy this preference.

Remove old consumer disables and inline suppressions for `unicorn/prefer-import-meta-properties`: the shared preset replaces the native rule once. Also remove explicit native-rule opt-ins. They restore its execution-context assumption and unsafe fixes even when the semantic counterpart is enabled. No consumer exception is needed to retain portable module paths.

### Layout animation audits

React and Next no longer enable `react-doctor/no-layout-property-animation` by default. This also applies when either preset is composed with the Playwright overlay. Core and standalone Playwright are unchanged.

Real layout can be part of the interaction contract. Instruments' design specifies a growing accordion and a height-bound pattern ribbon with proportional masks. MaterialGraph's specification panel animates its measured content height so the centered photograph moves with it as data arrives. Transform or layout-projection animation changes the intermediate layout-dependent states in these interactions. Moving the same animation into CSS or an indirect object merely hides it from the rule.

This is a change to the blanket rule's role, not an automatic intrinsic-size exception. Numeric dimensions and positional offsets are no longer rejected by default either. Layout animation still has a runtime cost; this policy change makes no claim about its measured performance. Prefer compositor animation when it preserves the product behavior, and measure frame costs when evaluating a necessary layout animation. Other React Doctor and Howells performance checks remain enabled.

Projects whose product contract bans layout animation can explicitly opt in. The existing plugin and exported rule sets remain available; no extra dependency or plugin entry is needed:

```ts
import react from "@howells/lint/oxlint/react";

export default {
  extends: [react],
  rules: {
    "react-doctor/no-layout-property-animation": "error",
  },
};
```

The same rule entry works with the Next preset. Remove old consumer suppressions or disables after upgrading when adopting the shared default; keep any intentional explicit opt-in.

## 3.9.1: preserve domain vocabulary

Core, React, Next and standalone Playwright no longer reject an identifier merely because it contains `shape`. Schema contracts such as `shapeId` and `valueShapes`, geometry concepts and imported contracts may use that vocabulary. Renaming a stored key or published API to satisfy a substring check changes the contract without improving the model.

The shared policy retires only `anti-slop/no-shape-in-symbol-names`. Other anti-slop checks remain enabled, including input-boundary validation and type-assertion requirements. Keep canonical domain names; no consumer rule override or alias is needed. Remove any consumer exception for this rule after upgrading.

## 3.8.0: correct switches, test matchers and class contracts

Core, React, Next and standalone Playwright inherit the rule changes. No tool versions change: Oxlint stays pinned to 1.86.0.

- Remove consumer overrides for `default-case` and `typescript/switch-exhaustiveness-check` that worked around their conflict. Exhaustive union switches omit `default`; open types such as `string` still require one. Missing union members and redundant defaults report. `unicorn/no-useless-switch-case` remains enabled.
- Test files (`*.test.*`, `*.spec.*`, `*.test-d.*`, `*.spec-d.*`, `__tests__/**`) and the preset's existing Vitest setup files permit Vitest's deliberately `any`-typed asymmetric matchers. Only `no-unsafe-assignment`, `no-unsafe-argument` and `no-unsafe-member-access` are disabled there. `no-unsafe-call` and `no-unsafe-return` remain enabled; production keeps all five.
- `class-methods-use-this` permits classes implementing interfaces and methods marked `override`. It still reports ordinary class methods without `this`. The preset uses Oxlint's `ignoreOverrideMethods: true` and `ignoreClassesWithImplements: "all"` option names.
- `vitest/valid-expect` accepts literal, template and variable messages. Literal and template messages already pass the pinned binary's defaults; `maxArgs: 2` is needed for variables. The rule still checks argument counts and matcher calls.

Generated files need one consumer configuration change. Ultracite already lists `**/*.generated.*` and generated directories, but Oxlint 1.86.0 does **not** merge `ignorePatterns` through `extends`, even when the consumer has no ignores of its own. Spread the named export into the root config, keeping any local patterns:

```ts
import core, { ignorePatterns } from "@howells/lint/oxlint/core";

export default {
  extends: [core],
  ignorePatterns: [...ignorePatterns, "**/project-output/**"],
};
```

For React, Next or standalone Playwright, keep the existing default preset import and import `ignorePatterns` from `/oxlint/core` separately. The export preserves Ultracite's complete ignore list and explicitly includes `**/generated/**`. These exclusions apply to both directory walks and explicitly named files. Extending the preset alone does not activate them.

## 3.6.0: GDP rules are enabled by default

The Ultracite 8 refresh enables its GDP authorization-proof rules in core. React, Next and standalone Playwright inherit them without an extra config entry. The pinned lint plugin is included in `@howells/lint`.

1. **Expect existing casts to report.** Ultracite's strict mode rejects every type assertion except `as const` outside `proofs/` and `lib/ids.ts`, even if the project does not use GDP. A `// SAFETY:` comment alone no longer makes an ordinary cast pass. Use typed values, narrowing or validation at the input boundary instead. Generated code should be ignored deliberately at the project level.

2. **Keep the trusted exceptions narrow.** `proofs/` modules may create proofs and use assertions, but must keep the prover private. `lib/ids.ts` permits branded-ID assertions while still rejecting forged proofs and proof creation. Other core rules, including anti-slop's safety-comment requirements, remain on in both locations. Do not move ordinary code into these directories simply to avoid findings.

3. **Keep new findings visible while migrating.** A project with a backlog can use the [lint ratchet](./docs/lint-ratchet.md) and reduce it incrementally. Any temporary exact-file override needs a removal path; do not disable GDP across the project.

4. **Application authorization still needs application code.** Lint rules do not retrofit permission checks. Applications adopting typed proofs install `@gdp-ts/core@0.1.0` as a runtime dependency, follow [the GDP recipe](./docs/gdp.md), and run their TypeScript check alongside linting.

## 3.3.0: a config Oxlint ignored is now applied

Take this one on its own. It changes nothing for a repo whose config is `oxlint.config.ts`, and it can surface a large backlog in a repo whose config is `oxlint.config.mjs`, `.js`, `.cjs` or `.cts`, because that config was never being read.

1. **Check which spelling you have.** `oxlint.config.ts` and `oxlint.config.mts` are discovered by Oxlint itself and are unaffected. The other four were silently ignored, so the package linted on Oxlint's defaults: no preset, no plugins, no rules, a quiet run and exit 0.

2. **Rename it to `oxlint.config.ts`** rather than relying on the new behaviour. The binaries pass `--config` for an ignored spelling, and that pins one config for the whole run, which overrides a nested config belonging to a package. Renaming restores Oxlint's own per-directory handling. The run prints a warning naming this until you do.

3. **Expect the backlog before you expect a clean run.** Lint once, read the count, and decide what to fix now against what to downgrade in your own config with a removal path. A repo that has never run its own rules will not be at zero.

4. **A repo with no Oxlint config keeps Oxlint's defaults.** There is no packaged fallback on this side, unlike Oxfmt. Adding one would impose a preset on repos that never asked for it, which is a larger change than the one this fixes.

## The design-system rules arrive

Take this with 3.2.0. It only changes projects on `@howells/lint/oxlint/react` or `/next`; a core-lane repo sees nothing.

0. **Take 3.2.1, not 3.2.0.** 3.2.0 reported every `text-[var(--token)]` as an off-token value, which is wrong in any repo whose design system is CSS custom properties. 3.2.1 exempts a bracket holding one variable reference and nothing else.

1. **Expect findings from two new rules, and expect them to be few.** `shadcn/no-arbitrary-values` reports an off-token Tailwind value such as `p-[13px]` and names the scale value that matches, so most are a one-token edit. `shadcn/require-static-classes` reports a `className` on a design-system component that the linter cannot read, such as `` `mt-${size}` ``; rewrite it as a `cn()` call with static strings, which the rule reads happily. Neither rule reports anything in a project without Tailwind.

2. **Nothing else is on.** `no-restyle`, `no-inline-styles`, `no-unknown-classes` and `no-raw-colors` ship loaded but disabled, because each enforces a policy only your repo holds. Turning on `no-restyle` with no `contracts` reports every existing `className` override on a recognised component at once, which in the larger UI repos here is four figures. Adopt it one component at a time.

3. **Pair `no-restyle` with the component-directory override when you do turn it on.** A component has to be able to style its own internals:

   ```ts
   import { componentSourceOverride } from "@howells/lint/oxlint/shadcn";

   overrides: [componentSourceOverride(["components/ui/**"])],
   ```

4. **Declare `settings.shadcn.ui` only if your components do not resolve from a local `components.json`.** A workspace alias such as `@workspace/ui/components` needs it, and it has to go in your own root config: Oxlint reads `settings` from the root config only and does not merge it through `extends`, so this package cannot ship it.

5. **Arbitrary layout values are allowed from 3.2.3.** `max-w-[68ch]`, `grid-cols-[minmax(0,1fr)_20rem]` and `top-[clamp(1.5rem,5vw,5rem)]` have no scale to move to, so the rule no longer reports them. Appearance keeps every check. A repo that wants arbitrary widths policed drops `layout` from the allow list in its own config.

6. **`cn` and `oxc-parser` join the dependency graph.** Both are transitive; don't add either to a consumer. ESLint stays out, and `test/consumer-install.test.mjs` still fails if it appears.

7. **Name a custom class-merging helper.** The rules recognise `cn`, `clsx`, `classNames`, `twMerge` and `cva`. A repo whose helper is called something else has every call reported under `require-static-classes`, because the linter treats the result as a `className` it cannot read. Declare it alongside `settings.shadcn.ui`, in the same root-config block and for the same reason:

   ```ts
   settings: { shadcn: { mergeFunctions: ["joinClassNames"] } },
   ```

   `variantFunctions` does the same for a `cva` wrapper.

8. **A forwarding wrapper reports, and the report is wrong.** `require-static-classes` flags the rest element in `const { className, ...rest } = props` followed by `<Badge {...rest} />`, because it does not see that `className` was destructured out and so cannot reach the component through `rest`. The rule is unsatisfiable for that shape, which is the shape of every wrapper in a design-system package. Scope it off for that tree and keep it at call sites, where a `className` the linter cannot read is a real problem.

9. **The settings and the version bump land in the same commit.** A config that names the `shadcn` plugin fails to build on an earlier version with `Plugin 'shadcn' not found`, so a repo cannot stage its settings ahead of the upgrade. Change the pin and the config together.

## ESLint leaves the graph

Take this with the Oxlint 1.82.0, Ultracite 7.11.1 and Oxfmt 0.67.0 refresh.

1. **Remove any direct `eslint` dependency and any ESLint peer override.** Nothing in the toolchain needs ESLint now: the Playwright rules load from a copy vendored in this package. `playwrightOverride`, `playwrightJsPlugins` and `playwrightRules` are unchanged, so Playwright configs need no edits.
2. **Remove a direct `oxc-parser` dependency** if one is left from an earlier migration.
3. **Run `lint:fix` once and commit the reflow** before reading findings. Oxfmt moves two minor versions.
4. **Expect a handful of new loop-condition findings.** `no-unmodified-loop-condition` now checks each branch of a ternary in a loop condition. Findings from `unicorn/no-nested-ternary` and `unicorn/prefer-reflect-apply` disappear, and their disable comments can go.

## 3.0.0: native TypeScript tooling

Oxlint remains the only lint engine. Remove consumer `github/*` and `sonarjs/*` rule overrides: their plugins are no longer installed or loaded. The latest versions still require the legacy TypeScript compiler API. Type-aware checks continue through oxlint-tsgolint, with no TypeScript 5/6 package in the graph.

This intentionally removes the 188 GitHub/SonarJS-specific rules previously inherited by core. Native Ultracite/Oxlint rules, React Doctor, Playwright and Howells workspace rules remain. Coverage is not equivalent: SonarJS-only checks such as duplicate strings, function naming and empty test files are retired. Existing 2.x consumers stay on their previous coverage until they opt into 3.x.

## The React Compiler rule becomes twenty-two rules

Take this with the Oxlint 1.80.0, Ultracite 7.10.6, and Oxfmt 0.65.0 refresh. The React part only reaches projects on `@howells/lint/oxlint/react` or `/next`; the rest applies everywhere.

1. **`react/react-compiler` no longer exists.** Oxlint 1.79.0 split that one nursery rule into per-category rules, and Ultracite 7.10.6 enables 22 of them at `error` in its place. If any config in your project names `react/react-compiler`, Oxlint now refuses to parse the whole file: `Rule 'react-compiler' not found in plugin 'react'`. Delete the entry. An `oxlint-disable` comment naming the old rule stops matching anything at all, so re-suppress the specific replacement rule if you still need the exemption.

2. **Expect more React findings on first run, and expect them to be real.** The replacements report the React Compiler's bail-out conditions one at a time instead of as a single verdict, and several are coverage this package did not have: `react/set-state-in-effect`, `react/set-state-in-render`, `react/no-deriving-state-in-effects`, `react/exhaustive-effect-dependencies`, `react/purity`, `react/immutability`, `react/refs`, `react/static-components`, `react/preserve-manual-memoization`, `react/use-memo`, `react/memo-dependencies`, and `react/error-boundaries`. Each names a component the compiler cannot optimise, so fix them rather than suppressing them.

3. **Ignored files you name explicitly are linted again.** Oxlint 1.79.0 applies `.gitignore` only to the directories it walks, not to a path passed on the command line. This reverses the first item under "2.0.0 toolchain refresh" below: a script that lints a generated or gitignored path by name now gets findings from it again. If you dropped such paths from your lint targets to work around 1.78.0, put them back and expect a backlog.

4. **Core gains two rules.** Ultracite 7.10.6 adds `one-var` set to `never`, so a comma-separated `const a = 1, b = 2` has to become one declaration per binding, and `jsdoc/no-blank-blocks`, which rejects an empty `/** */` left behind by a deleted comment. Both are mechanical.

Oxfmt moves from 0.63.0 to 0.65.0: comment placement around unions, an `EmptyStatement` fix, and class decorators before `export`. Run `lint:fix` once and commit the reflow before you read the lint findings, so the two do not mix.

ESLint stays on 9.39.5 and TypeScript on 6.0.3. Both holds were rechecked against this refresh and both still stand for the reasons recorded under 1.2.0.

## The Playwright overlay changes shape

Take this if your project is on 2.0.0 and lints its E2E directory. 2.0.0 moved the Vitest rules from the core preset's top level into Ultracite's override, and a Playwright spec matches that override's globs under either naming convention, so E2E tests started drawing Vitest findings that no call site can fix. A project still on 1.x or 0.x is not affected yet and will inherit it on upgrade.

If your `oxlint.config.ts` carries a Playwright overlay written as

```ts
overrides: [{ files: ["e2e/**/*.{ts,tsx}"], rules: playwrightRules }],
```

replace it with

```ts
overrides: [playwrightOverride(["e2e/**/*.{ts,tsx}"])],
```

and change the import from `playwrightRules` to `playwrightOverride`. The old shape still works and still applies the Playwright rules; it just does not carry the Vitest exemption, because that exemption needs `plugins: ["vitest"]` in the same override entry and a bare rules object cannot supply it.

Then delete any per-file or per-line suppression you added for a `vitest/*` rule in an E2E test, and undo any import aliasing you introduced to dodge `vitest/prefer-importing-vitest-globals` — aliasing `test` blinds `sonarjs/no-empty-test-file`, so the alias was costing you a real check. Naming makes no difference to this: the exemption covers `e2e/**/*.test.ts` and `e2e/**/*.spec.ts` alike, and you do not need to rename anything.

A dedicated E2E package extending the preset directly (`extends: [playwright]`) needs no change; the exemption is inside the preset.

## 2.0.0 removes the Biome lane

**If your project runs Biome, do not take 2.0.0.** Stay on the 1.x range you already have. It keeps working; it just stops receiving new policy. Take 2.0.0 when you are ready to move that project onto `howells-check`.

2.0.0 deletes `@howells/lint/biome/core`, `/biome/react`, `/biome/next`, the `howells-biome` binary, and the `@biomejs/biome` dependency. There is no deprecation window and no shim — a `biome.json` that extends one of those presets fails to resolve after the upgrade.

If your project has a `biome.json` extending these presets but its `lint` script already calls `howells-check`, the config is dead weight. Delete `biome.json`, drop `howells-biome` from any remaining script, and take 2.0.0 normally.

ESLint is untouched and is not being removed. It is not a lane: `eslint-plugin-github`, `eslint-plugin-sonarjs` and `eslint-plugin-playwright` run inside Oxlint through its JS-plugin bridge and supply 188 of the core preset's rules plus all 36 in the Playwright preset. Nothing in your project runs ESLint directly, and nothing should.

## 2.0.0 toolchain refresh, anti-slop, and Vitest

Version 2.0.0 moves the toolchain to Ultracite 7.10.5, Oxlint 1.78.0, Oxfmt 0.63.0, and React Doctor 0.9.12. Update `@howells/lint`, reinstall, and run `lint:fix` once. Four things change what your project reports, and two of them are new rule sets in the core preset rather than a version bump.

1. **Oxlint stops linting ignored paths, even when you name them.** Oxlint 1.78.0 skips anything under `node_modules`, anything in a dot-prefixed directory, and anything matched by `.gitignore` — including a path passed directly on the command line. `--no-ignore` does not lift it. If a script lints a hidden directory (`.storybook`, `.github/scripts`, a `.config` folder), those files are now silently unlinted; `howells-check` reports "Expected at least one target file" when that leaves nothing to do. Move the source out of the hidden directory, or drop it from the lint targets deliberately rather than by accident.

2. **Next.js route files stopped tripping the Fast Refresh rule.** React Doctor 0.9.12 rewrote its port of the react-refresh rule with a default that has no framework or route-file awareness, so every `page.tsx` exporting `metadata`, `dynamic`, `revalidate`, or `generateStaticParams` beside its component reported itself as unsafe. `@howells/lint/oxlint/next` turns that port off and runs Oxlint's native `react/only-export-components` with an allowlist of Next's route-segment export names. Nothing is required on your side, and any local override you added for `react-doctor/only-export-components` in a Next project can be removed. `@howells/lint/oxlint/react` is unchanged: it keeps React Doctor's default, which is the real react-refresh contract for a non-Next React app — a file exporting both a component and a helper constant is still an error there.

3. **Anti-slop is on everywhere.** The core preset now carries Ultracite's bundled build of [anti-slop](https://github.com/dmmulroy/anti-slop), so React and Next inherit it too. Expect findings on first run, and expect most of them to be real: a type assertion with no stated reason, `unknown` in a parameter or return where a named type belongs, `Reflect.get` standing in for property access, a runtime `typeof` that should be a type guard. Two rules are a style position rather than a bug hunt — `no-object-parameters` and `no-runtime-typeof` — and `require-safety-comment-for-type-assertion` wants a `// SAFETY:` comment above each remaining assertion. Fix them; that is what the rules are for. `no-runtime-typeof` exempts `typeof` inside a type predicate, which is the shape it is pushing you toward. No new dependency is involved.

4. **Vitest rules moved to Ultracite's set and are now scoped to test files.** This package used to enable twelve `vitest/*` rules at top level. The core preset now extends Ultracite's Vitest preset instead: roughly sixty rules, applied only to `*.test.*`, `*.spec.*`, and `__tests__` files. A test suite that passed on the old dozen will surface new findings — `prefer-to-be` over `toEqual` on primitives, `prefer-strict-equal`, hooks ordering, `require-top-level-describe`, `expect-expect` — and `lint:fix` handles a good share of them.

ESLint stays on 9.39.5 and TypeScript on 6.0.3. Both holds were rechecked against this refresh and both still stand for the reasons recorded under 1.2.0.

## 1.2.1 casing fix

If 1.2.0 reported `sonarjs/function-name` on your Next.js route handlers (`GET`, `POST`, `PATCH`, `DELETE`) or on PascalCase components, take 1.2.1 and re-run. Those were unfixable by rename — the framework dispatches route handlers by name, and a lowercase JSX tag is a different program — and they are gone in 1.2.1 without any change on your side. Do not rename anything to satisfy 1.2.0, and remove any local override you added for it.

## 1.2.0 toolchain refresh

Version 1.2.0 refreshes the Oxlint/Oxfmt lane to Ultracite 7.10.0 and Oxlint 1.76.0. Update `@howells/lint`, reinstall, and run `lint:fix` once. Three things can change what your project reports.

1. **Next.js projects get React Doctor's Next.js rules back.** Ultracite 7.10.0 moved the 23 `react-doctor/nextjs-*` rules into a separate opt-in preset. Taking that release without this one would have quietly dropped them from `@howells/lint/oxlint/next` — passing CI, no coverage. They are wired back in, so a Next.js project that drifted while they were effectively absent may surface real findings on first run: raw `<img>` and `<a>` elements, `next/image` without `sizes`, async client components, redirects inside `try`/`catch`. Fix them; they are the findings the preset was always meant to report.

2. **Named React components must be arrow functions, except where Next.js requires otherwise.** Ultracite's React preset now enables `react/function-component-definition` with `namedComponents: "arrow-function"`. Under `@howells/lint/oxlint/react`, `export function Widget() {}` becomes an error — write `export const Widget = () => {}`. Under `@howells/lint/oxlint/next`, the function-declaration form is allowed back, because Next.js mandates a default export per route file and generates `export default function Page()`. Non-default-exported function declarations are still rejected in Next projects too, by core's `func-style`.

3. **React projects lose the TanStack Start rules.** Ultracite split React Doctor's framework rules out of the base JS-plugin preset. `@howells/lint/oxlint/react` keeps the `react-doctor/query-*` rules, which only match TanStack Query's own API and so never fire in a project that does not use it. The `react-doctor/tanstack-start-*` rules are dropped: several fire on generic JSX and recommend TanStack Router replacements, which is noise in a Next.js codebase. If a project genuinely runs TanStack Start, that is a case for a new shared preset here, not a local override.

Ultracite's core preset also adds `id-denylist`, `node/exports-style`, and `oxc/bad-match-all-arg`, and turns `node/no-top-level-await` off. These are taken as upstream ships them.

ESLint stays on 9.39.5 and TypeScript on 6.0.3 even though 10.8.0 and 7.0.2 are published. Both are deliberate holds:

- ESLint 10 is blocked below `eslint-plugin-github`, which pulls `eslint-plugin-import@2.32.0` and `eslint-plugin-jsx-a11y@6.10.2`. Neither declares an ESLint 10 peer, so the install produces the unmet-peer graph that 1.1.0 was written to repair.
- TypeScript 7 is blocked by the JS-plugin bridge: `@typescript-eslint/utils@8.65.0` declares peer `typescript >=4.8.4 <6.1.0`, and `eslint-plugin-sonarjs@4.2.0` depends on `typescript >=5 <6.1.0`.

Do not add a local override to force either one — it breaks the JS-plugin bridge, and consumers should not be carrying tool overrides at all. Both will lift here when upstream allows it.

## 1.1.1 workspace and fixer behavior fixes

Version 1.1.1 changes two consumer-visible behaviors:

1. **`howells-workspace-check` treats the repo's `.node-version` as the source of truth.** It no longer demands one exact Node version. It now requires that `.node-version` exists as a plain `x.y.z` pin at or above the tool's floor (`24.15.0`), and that the root `engines.node` lower bound covers the pinned version. A repo pinning `24.16.0` with `engines.node: ">=24.16.0 <25"` now passes; it failed under 1.1.0's exact-match rule.

2. **`howells-fix` exits 0 when the given paths hold nothing lintable.** When every passed file is excluded by ignore rules or is not a lintable type (a JSON/lockfile-only commit from lint-staged, say), the fixer prints an informational line and succeeds instead of failing with Oxlint's "No files found to lint" error. Explicitly-named paths that do not exist on disk still fail.

## 1.1.0 compatibility fix

Version 1.1.0 corrects the runtime dependency graph used by Ultracite's Oxlint JS plugins. It keeps ESLint on the newest release supported by the complete GitHub plugin tree and pins a compatible TypeScript runtime for Ultracite and SonarJS. Consumers do not need peer overrides or direct lint-tool dependencies; remove any temporary ESLint or TypeScript override added for 1.0.0, update `@howells/lint`, and reinstall.

The 1.1.0 binaries also pass the nearest `oxfmt.config.*` file to Oxfmt explicitly and fall back to the packaged Howells preset when no project config exists. This repairs 1.0.0's silent use of Oxfmt defaults. Run the project's `lint:fix` once after updating and review the resulting formatting changes.

## 1.0.0 breaking changes

Upgrading from a 0.x release to 1.0.0 changes four things consumers can feel:

1. **React Doctor rules are now errors.** The Oxlint React and Next presets used to spread React Doctor's published severities, which were mostly warnings. They now include the React Doctor portion of Ultracite's opt-in JS-plugin preset, which enables every React Doctor rule at `error`. A codebase that previously passed with React Doctor warnings can now fail `howells-check`/CI with no code change. This is intentional — the rules describe real correctness and performance problems. To adopt incrementally, spread `disabledReactDoctorRules` from `@howells/lint/oxlint/react-doctor-rules` (or disable specific `react-doctor/*` rules) in a project override, and treat it as a migration exception with a removal path, not a permanent preference.

2. **Node standard is 24.15.0.** `engines.node` is now `>=24.15.0`; pin `.node-version` to `24.15.0` and align the root `engines.node`. `howells-workspace-check` enforces this.

3. **Type-aware linting works from consumer projects.** Oxlint's type-aware mode needs the `tsgolint` executable, which pnpm keeps inside this package's dependency tree and out of a consumer's `node_modules/.bin` search path when run from a subdirectory or with a non-hoisting `.npmrc`. The `howells-check`, `howells-fix`, and `howells-oxlint` binaries now resolve `tsgolint` and pass it to Oxlint via `OXLINT_TSGOLINT_PATH`, so type-aware rules run reliably regardless of working directory. Run Oxlint through these binaries rather than a raw `oxlint` call to get this behavior.

4. **`howells-check` and `howells-fix` report both tools in one run.** They no longer stop at the first failing stage: the formatter check and the linter both run every time, so a single invocation surfaces every formatting and lint problem, then exits non-zero if either failed.

## Primary rule

Do not migrate an old local lint philosophy into a new local override.

Pick the closest shared preset first. Only add local config after you can explain why the repo is a real exception.

## Preset selection

There is one toolchain. Choose the closest preset:

- Node or non-React TypeScript: `@howells/lint/oxlint/core`
- React package or app without Next.js specifics: `@howells/lint/oxlint/react`
- Next.js app: `@howells/lint/oxlint/next`
- Playwright E2E tests: use the Playwright export as an overlay on the app preset, or as `@howells/lint/oxlint/playwright` for a dedicated E2E package

If none of these fit cleanly, the likely answer is a new shared preset here, not a repo-specific fork.

## Migration steps

1. Add `@howells/lint` as a dev dependency.
2. Pin Node with `.node-version` set to `24.15.0` and `engines.node` set to `>=24.15.0`.
3. Replace `eslint`, `next lint`, `prettier`, `biome`, or direct Oxlint/Oxfmt scripts with this package's binaries.
4. Replace local lint config with a minimal config that only extends one shared preset.
5. Remove direct `eslint`, `eslint-config-*`, `eslint-plugin-*`, `prettier`, `@biomejs/biome`, `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint-plugin-playwright`, and `oxc-parser` dependencies once the project is green.

## Config files

Add `oxlint.config.ts` and `oxfmt.config.ts` using the exports from `@howells/lint`, then use:

- `@howells/lint/oxlint/core` for Node or non-React TypeScript
- `@howells/lint/oxlint/react` for React (Ultracite React + React Doctor)
- `@howells/lint/oxlint/next` for Next.js (react preset + Next.js rules)
- `@howells/lint/oxlint/playwright` as an overlay for Playwright E2E tests or as a preset for dedicated E2E packages

The core preset enables Oxlint type-aware mode. A project adopting it should be ready for Oxlint's TypeScript type-aware constraints.

If type-aware mode blocks initial adoption, temporarily override `options.typeAware` to `false` in the local config and track its removal. Treat this as a migration exception, not as a normal project preference.

Each primary Oxlint preset is self-contained. Extend only the closest primary preset — do not stack `core`, `react`, and `next` together. Treat Playwright as an overlay when E2E tests live inside an app, and as a standalone preset only for dedicated E2E packages.

```json
{
  "scripts": {
    "lint": "howells-check .",
    "lint:fix": "howells-fix ."
  }
}
```

Do not run a previous linter alongside these binaries indefinitely. If both are present during a migration, write down which command is authoritative and remove the other once the migration is green.

## Keep local config thin

The normal local config should only extend the closest preset.

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

Acceptable local additions:

- repo-specific file includes or force-ignores for generated files that are unique to one project
- one-off rule changes tied to a genuine platform constraint
- temporary compatibility shims during migration

Avoid:

- copying old ESLint or Biome rule customizations across
- broad `linter.rules` sections to preserve team habit
- local wrapper configs like `base.json` or `library.json`
- repeating the same override across multiple repos

## Promote shared patterns quickly

If the same override or ignore pattern appears in more than one active project, treat that as pressure on `@howells/lint`.

Either:

- move the shared behavior into an existing preset, or
- add a new preset with a name that describes the actual environment

Do not normalize repeated local exceptions.

## Prefer scope in scripts

If one repo only needs a narrower target, prefer script-level scope.

```json
{
  "scripts": {
    "lint": "howells-check apps/web packages/ui",
    "lint:fix": "howells-fix apps/web packages/ui"
  }
}
```

That is usually better than teaching the config about the repo layout.
