# Changelog

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
