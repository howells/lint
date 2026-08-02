# Changelog

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
