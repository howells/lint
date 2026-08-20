# Changelog

## Unreleased

### Added

- `playwrightOverride(files)`, `vitestRulesOff`, and `playwrightPlugins` on `@howells/lint/oxlint/playwright`. `playwrightOverride` returns a complete Oxlint override entry for an app's E2E globs — the Playwright rules, Ultracite's Vitest rules off, and `plugins: ["vitest"]` — and is now the documented overlay shape. `playwrightRules` and `playwrightJsPlugins` are unchanged and still exported.

### Fixed

- The Playwright lane no longer draws Vitest findings. **This is a 2.0.0 regression.** Before that release the core preset carried `vitest` in its top-level `plugins` and named twelve rules at top level, where a consumer's later `"vitest/x": "off"` could reach them. 2.0.0 replaced that with Ultracite's Vitest preset, which is a single `overrides` entry scoped to `*.test.*`, `*.spec.*`, and `__tests__` — and an override beats top level for the files it matches, so the disable stopped working. A Playwright spec is named the same way under either convention, so the whole Vitest set now applies to E2E tests and lints them against a runner that is not there.

  `vitest/prefer-importing-vitest-globals` is the rule that bites in practice. It matches on the _names_ `expect` and `test` rather than on the import source, so it fires on a correctly imported Playwright `expect` and no call site can satisfy it; aliasing both imports silences it but blinds `sonarjs/no-empty-test-file`, which then reports the spec has no tests, trading one finding for a worse one. `vitest/consistent-test-filename` is the second — it demands `.spec.ts` be renamed to `.test.ts`. Playwright's own default `testMatch` accepts both spellings, so that one only conflicts in a repo whose config pins `.spec.ts` by name.

  The exemption is read out of Ultracite's own preset rather than listed by hand, so a Vitest rule added upstream is covered without this package being touched. It is scoped by path: a Vitest test outside the Playwright globs keeps every rule, and `sonarjs/no-empty-test-file` still reports a genuinely empty spec. Both are held by tests.

  The disable has to carry `plugins: ["vitest"]` wherever it lands. Oxlint resolves a rule entry against the plugin set in scope at that point, and `vitest` is absent from the core preset's top-level `plugins` — Ultracite enables it inside its own override. Without the plugin named, `"vitest/x": "off"` is discarded without a word, at top level and inside an override alike; that silence is why this looked unfixable from a consumer's config. A test holds the broken shape and asserts the findings survive it, so the fix cannot rot into a no-op.

  Only a consumer on 2.0.0 that lints its E2E directory is affected. A repo still on 1.x or 0.x inherits this the moment it upgrades.

## 2.0.0 — 2026-08-15

### Removed

- **The Biome lane.** The `@howells/lint/biome/core`, `/biome/react` and `/biome/next` presets, the `howells-biome` binary, and the `@biomejs/biome` dependency are gone. Oxlint/Oxfmt is the whole toolchain. Seven repositories held a `biome.json` extending these presets at the point of removal, but only two still ran Biome from a `lint` script — the other five had already moved to `howells-check` and left dead config behind. This ships as a major precisely so nothing is taken by surprise: a consumer only crosses 2.0.0 by asking for it, and 1.x keeps working for as long as a project stays there. `docs/adr/0003-remove-the-biome-lane.md` records the reasoning; `docs/adr/0002` is marked superseded rather than deleted.

ESLint is unaffected and is not going anywhere. It is not a lane and never was: `eslint-plugin-github`, `eslint-plugin-sonarjs` and `eslint-plugin-playwright` run _inside_ Oxlint through its JS-plugin bridge, and account for 188 of the core preset's 678 enabled rules plus all 36 in the Playwright preset. The pinned `eslint` dependency is the runtime they resolve against.

### Added

- The core preset carries Ultracite's build of the [anti-slop](https://github.com/dmmulroy/anti-slop) plugin, so React, Next and Playwright inherit it. It rejects the low-evidence TypeScript that turns up when code is written fast: type assertions with no stated reason, `unknown` in parameters and returns, `Reflect.get`/`Reflect.apply` property access, module mocking, widen-then-assert. No new dependency — the plugin is unpublished upstream and Ultracite vendors a bundled build. It is extended last, after Ultracite's core preset, because it disables `typescript/consistent-indexed-object-style` and `unicorn/no-immediate-mutation`, which deadlock against `anti-slop/no-known-value-widening` — the autofix of one produces the input of the other. Nothing after core turns them back on, so React and Next inherit the resolution too.
- The core preset carries Ultracite's Vitest rules, scoped by upstream to `*.test.*`, `*.spec.*`, and `__tests__` files. This replaces the twelve rules this package hand-rolled at top level with roughly sixty, and picks up the conflict resolutions Ultracite maintains against them (`valid-title` off against `prefer-describe-function-title`, `prefer-called-times` off against `prefer-called-once`, and so on). Vitest rules no longer apply outside test files, which is where they were always inert anyway.

### Changed

- Refresh the toolchain: Ultracite 7.10.5, Oxlint 1.78.0, Oxfmt 0.63.0, React Doctor's Oxlint plugin 0.9.12, `oxc-parser` 0.144.0. The JS-plugin bridge set (GitHub 6.1.2, SonarJS 4.2.0, Playwright 2.11.0) and `oxlint-tsgolint` 7.0.2001 are unchanged and already current.

### Fixed

- The Next preset accepts a route file's segment exports again. React Doctor 0.9.x rewrote its port of the react-refresh rule with a stripped-down default — no framework detection, no route-file awareness — so under 0.9.12 every `page.tsx` exporting `metadata`, `dynamic`, `revalidate`, or `generateStaticParams` alongside its component reported itself as unsafe for Fast Refresh. Upstream's remedy is `settings: { "react-doctor": { portedRuleMode: "curated" } }`, which a shared preset cannot deliver: Oxlint reads `settings` from the root config only and does not merge it through `extends`, so it would have to be pasted into every consumer's own `oxlint.config.ts`. The React preset keeps React Doctor's default, which is the genuine react-refresh contract. The Next preset turns the ported rule off and runs Oxlint's native `react/only-export-components` with an allowlist of Next's route-segment export names — rule options, unlike `settings`, do flow through `extends`.

### Notes

- Oxlint 1.78.0 no longer lints a path it considers ignored — `node_modules`, any dot-prefixed directory, anything matched by `.gitignore` — even when that path is named explicitly on the command line, and `--no-ignore` does not lift it. It reports "No files found to lint" instead. This package's own preset fixtures lived under `node_modules` for plugin resolution and now run from a temp directory with a `node_modules` symlink. A consumer linting a hidden directory (`.storybook`, `.github/scripts`) will see the same silence; `howells-check` surfaces it as "Expected at least one target file".
- ESLint stays on 9.39.5 and TypeScript on 6.0.3. Both holds were rechecked against this refresh and both still stand for the reasons given in 1.2.0: `eslint-plugin-github` still pulls `eslint-plugin-import@2.32.0` and `eslint-plugin-jsx-a11y@6.10.2`, neither of which admits ESLint 10, and `@typescript-eslint/utils` still declares peer `typescript >=4.8.4 <6.1.0`.

## 1.2.1 — 2026-08-13

### Fixed

- The React and Next presets accept the casing React and Next.js require. `sonarjs/function-name` defaults to `^[_a-z][a-zA-Z0-9]*$` and Ultracite enables it — SonarJS itself ships it disabled in `recommended` — so in a React lane it fired on the one place the ecosystem _mandates_ PascalCase, and in a Next lane it fired on names the framework dispatches on and which therefore cannot be renamed at all: `GET`, `POST`, `PATCH`, `DELETE`. This made 1.2.0's Next relaxation self-contradicting: the preset deliberately re-allowed `export default function Page()` and then rejected the name `Page`. Measured on a ~460-file consumer app it was 70 errors, none of them fixable in the app — 55 route-handler exports and 15 components; with the fix, zero. The format widens to camelCase or PascalCase in the React preset and is inherited by Next. `core` keeps the strict default: a lowercase JSX tag resolves to an intrinsic element, so the exemption is meaningless outside a React lane and should not leak into Node packages. Two tests cover it, including that `_Mixed_Up` is still rejected — the rule is widened, not switched off — and that `core` still rejects PascalCase.

## 1.2.0 — 2026-08-03

### Changed

- Refresh the Oxlint/Oxfmt lane: Ultracite 7.10.0, Oxlint 1.76.0, Oxfmt 0.61.0, React Doctor's Oxlint plugin 0.9.3, `oxc-parser` 0.142.0, Biome 2.5.6, and the JS-plugin bridge set (GitHub 6.1.2, SonarJS 4.2.0, Playwright 2.11.0). Oxlint 1.76.0 declares a hard peer on `oxlint-tsgolint` `>=7.0.2001`, so tsgolint moves from 0.24.0 to 7.0.2001 with it — a renumbering, not 7 majors of change.
- The Next preset relaxes Ultracite's new `react/function-component-definition` to accept the function-declaration form for named components. Upstream requires arrow functions; Next.js requires a default export from every page, layout, and error boundary and writes it as `export default function Page()`, so the arrow-only form makes the framework's own generated code unlintable. The relaxation is narrower than it reads: core's `func-style` still rejects named function declarations that are not default exports, so this frees the shape Next.js mandates and nothing else. The React preset keeps upstream's arrow-only position.
- The React preset no longer carries React Doctor's TanStack Start rules. Ultracite moved them behind an opt-in preset because several fire on generic JSX — `tanstack-start-no-anchor-element` rejects a plain `<a>` — and this lane targets Next.js. The `query-*` rules stay, since they only match TanStack Query's own API and cannot fire in a repo that never calls it.

### Fixed

- Restore React Doctor's 23 `react-doctor/nextjs-*` rules to the Next preset. Ultracite 7.10.0 moved them out of `ultracite/oxlint/js-plugins` into a separate opt-in preset, which silently emptied the Next.js set from this package's presets — every consumer would have kept passing CI while losing the rules that catch a raw `<img>`, a missing `sizes`, an async client component, or a redirect inside `try`/`catch`. The Next preset now extends Ultracite's Next JS-plugin preset directly, and a test asserts the rules arrive.
- The `disabledReactDoctorRules` escape hatch derives from the presets this package actually enables rather than from the plugin's static exports, so it stays complete when Ultracite next moves rules between its JS-plugin presets.

### Notes

Both of these are deliberate holds, not oversights. The caps are cited so the next refresh can re-check them directly instead of rediscovering why.

- ESLint stays on 9.39.5. ESLint 10.8.0 is published and all three direct plugins accept it — `eslint-plugin-github@6.1.2` and `eslint-plugin-sonarjs@4.2.0` both declare `^10`, `eslint-plugin-playwright@2.11.0` declares `>=8.40.0`. It was tried and reverted: `eslint-plugin-github` still pulls `eslint-plugin-import@2.32.0` (peer `^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9`) and `eslint-plugin-jsx-a11y@6.10.2` (peer `^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9`), neither of which admits ESLint 10, and `pnpm peers check` fails on both. Moving now would reintroduce the broken peer graph 1.1.0 repaired. Recheck when those two ship an ESLint 10 peer.
- TypeScript stays on 6.0.3, the newest published 6.x. TypeScript 7.0.2 is published, but the JS-plugin bridge caps below it: `@typescript-eslint/utils@8.65.0` — Ultracite's own dependency, and the runtime the bridge loads — declares peer `typescript >=4.8.4 <6.1.0`, and `eslint-plugin-sonarjs@4.2.0` depends on `typescript >=5 <6.1.0`. Recheck when `@typescript-eslint` lifts its cap past 6.1.

## 1.1.2 — 2026-07-17

### Fixed

- The Oxlint core preset turns off core `require-await`. Ultracite enables it alongside typed `typescript/promise-function-async`, and together they contradict: the typed rule forces `async` onto every promise-returning function, and core `require-await` then rejects any of them with nothing to await — making a no-await implementation of a promise-typed signature (test stubs, passthrough adapters) unwritable. The typed rule carries the intent; the untyped one yields. Covered by a preset regression test.

## 1.1.1 — 2026-07-12

### Fixed

- `howells-workspace-check` no longer demands one exact Node version. The repo's `.node-version` is now the source of truth: it must be a plain `x.y.z` pin at or above the `24.15.0` floor, and the root `engines.node` lower bound must cover it. A repo pinning `24.16.0` with `engines.node: ">=24.16.0 <25"` now passes.
- `howells-fix` exits 0 with an informational notice when the given paths resolve to nothing lintable after ignore rules (for example a JSON-only lint-staged commit), instead of failing with Oxlint's "No files found to lint" error. Explicitly-named paths that do not exist still fail.

## 1.1.0 — 2026-07-11

### Added

- Add the opt-in `howells/no-raw-jsx-elements` rule for enforcing component primitives.
- Add the opt-in `howells/no-raw-type-utilities` rule for enforcing governed typography utilities and size ladders.
- Add isolated packed-consumer verification for peer dependencies, preset loading, and Oxfmt configuration.

### Changed

- Upgrade Ultracite to 7.9.3, Biome to 2.5.3, GitHub's ESLint plugin to 6.1.0, and React Doctor's Oxlint plugin to 0.7.3.
- Preserve GitHub, SonarJS, and React Doctor coverage after Ultracite moved those rules into its opt-in JS-plugin preset.
- Pin every owned tool dependency exactly, including `@manypkg/cli`.

### Fixed

- Repair the ESLint and TypeScript runtime graph used by Oxlint's JavaScript-plugin bridge without consumer overrides.
- Resolve JavaScript plugins from `@howells/lint` so consumers continue to install only this package.
- Make `howells-check`, `howells-fix`, and `howells-oxfmt` discover the nearest Oxfmt config and use the packaged preset when none exists.
