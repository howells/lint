# Adoption Notes

Use these notes when replacing an existing ESLint, Prettier, Biome, or ad hoc Oxlint/Oxfmt setup with `@howells/lint`.

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
