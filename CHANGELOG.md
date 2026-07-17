# Changelog

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
