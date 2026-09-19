# @howells/lint

The shared lint and format toolchain. It pins Oxlint, Oxfmt, Ultracite, React Doctor and `@manypkg/cli`, and ships the preset matrix every Howells repo extends. Consumers depend on this package, never on the underlying tools, so an edit here reaches every repo: read `CONTEXT.md` and `docs/adr/` before changing a preset or an error string.

## Lanes

- Oxlint and Oxfmt are the only lane. 2.0.0 removed the Biome one; see `docs/adr/0003-remove-the-biome-lane.md`. Don't reintroduce Biome or describe it as frozen or retained. A repo that still needs it stays on 1.x.
- Oxlint is the only lint engine and ESLint isn't installed. The Playwright rules are vendored in `vendor/eslint-plugin-playwright` and load through Oxlint's JS-plugin bridge (`docs/adr/0004`). The shadcn design-system rules are vendored in `vendor/shadcn-lint` for the same reason: the published package depends on `@typescript-eslint/parser`, which pulls ESLint and a legacy TypeScript compiler into every consumer (`docs/adr/0005`). The GitHub and SonarJS plugins were removed for the same dependency.

## Commands

- `pnpm test` - the Node test suite (`node --test`).
- `pnpm prepush` - the full gate: `lint` (oxfmt check, then oxlint with `--deny-warnings`) and `test`. The suite covers the peer-dependency check, in test/peer-dependencies.test.mjs.

## The contract

- `docs/exports.md` - the preset and binary matrix, how the presets compose, and the opt-in rules a consumer enables itself.
- `docs/consumer-wiring.md` - the six steps to put a repo on this package, and how config discovery behaves.
- `docs/internals.md` - the rules for editing this package, and refreshing the vendored plugins.
- `docs/releasing.md` - tag, publish and trusted publishing.
