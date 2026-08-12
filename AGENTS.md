# @howells/lint

The shared lint and format toolchain. It pins Oxlint, Oxfmt, Ultracite, React Doctor, Biome and `@manypkg/cli`, and ships the preset matrix every Howells repo extends. Consumers depend on this package, never on the underlying tools.

## Lanes

- Oxlint/Oxfmt is the preferred lane and the only one that gets new policy.
- Biome is a frozen compatibility lane: dependency, breakage and ecosystem fixes only.
- Don't mix Biome and Oxlint/Oxfmt scripts in one package unless there's a deliberate migration plan.

## What it exports

- Oxlint presets: `@howells/lint/oxlint/core` (Node or non-React TypeScript), `/oxlint/react`, `/oxlint/next`, `/oxlint/playwright` (overlay for app E2E tests, or standalone preset for a dedicated E2E package), `/oxlint/boundaries` (the workspace boundary rule alone, for configs that can't extend a standard preset), `/oxlint/react-doctor-rules` (compose or disable React Doctor rules in mixed workspaces), `/oxlint/neon`.
- Oxfmt preset: `@howells/lint/oxfmt`, a default-exported config object.
- Biome presets: `@howells/lint/biome/core`, `/biome/react`, `/biome/next`.
- Binaries: `howells-check` (oxfmt `--check` plus oxlint in one pass, both results reported, fails if either fails), `howells-fix` (oxfmt `--write` then oxlint `--fix`), `howells-oxlint`, `howells-oxfmt`, `howells-biome`, `howells-ultracite`, `howells-workspace-check`, `howells-workspace-fix`.
- Every Oxlint preset enforces the Howells workspace convention: apps under `apps/*`, shared packages under `packages/*`, packages never import apps, apps never import sibling apps.

## Wiring a consumer repo

1. Install `@howells/lint` as the only direct lint dependency. Don't add `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint-plugin-playwright`, `oxc-parser`, `@biomejs/biome` or `@manypkg/cli` directly; they're pinned transitively.
2. Set `engines.node` to `>=24.15.0`, `packageManager` to `pnpm@11.5.2`, and add a root `.node-version` of `24.15.0`.
3. Add `oxlint.config.ts` extending the closest preset, and `oxfmt.config.ts` re-exporting `@howells/lint/oxfmt`.
4. Scripts: `"lint": "howells-check ."` and `"lint:fix": "howells-fix ."`. Keep `lint` non-mutating; all writes go in `lint:fix` or `format`. The Oxlint lane has no `lint:strict` - type-aware linting, React Doctor, boundaries and Playwright overlays all belong in the normal check.
5. Monorepo roots only: `"lint": "turbo run lint && howells-workspace-check"` and `"lint:fix": "turbo run lint:fix && howells-workspace-fix"`. Never put workspace lint in individual packages or single-package apps, and have CI call `pnpm lint` rather than `turbo lint`, which bypasses it.
6. Verify with `pnpm lint`.

`howells-oxfmt`, `howells-check` and `howells-fix` discover `oxfmt.config.*` upwards from the cwd and fall back to the packaged preset. An explicit `--config` on `howells-oxfmt` always wins; on `howells-check`/`howells-fix` the config flag is reserved for Oxlint.

Type-aware Oxlint is on by default. `options: { typeAware: false }` is a migration exception with a removal path, not a project preference.

## Opt-in rules a consumer enables itself

- `howells/no-raw-jsx-elements` bans lowercase JSX host elements so markup renders only design-system components. No preset enables it; a consumer adds it with an `allow` list (a Next root shell needs `html` and `body`).
- `howells/no-raw-type-utilities` bans Tailwind typographic utilities outside the project's own `allow` list of type tokens. Colour, alignment and wrapping aren't governed by default; add them to `match` if you want them policed.
- The `howells` plugin is already loaded by every preset via `jsPlugins`, so a consumer only adds the rule entry.

## Editing this package

- Read `CONTEXT.md` before changing language in the README, presets or error strings. `docs/adr/` records why the lanes are arranged as they are.
- Shared presets absorb recurring failures. If several repos need the same exception, change the preset here rather than the repos. A preset is not a preference dump for one repo.
- Don't weaken a shared rule for a single consumer without a documented migration exception carrying a removal path.
- Don't rename a public binary or preset export without migration docs, tests and a `MIGRATIONS.md` entry.
- Workspace lint covers package manager, runtime and workspace configuration only. Don't grow it into general repo health. It may recognise more folder names than the boundary rule, because it assigns them no import meaning.
- Keep output readable; hooks and agents parse it.
- ESLint is held at 9.39.5 and TypeScript at 6.0.3 on purpose - `eslint-plugin-github` and `@typescript-eslint/utils` peer ranges block the next majors. Read `MIGRATIONS.md` before bumping either.
- Search `test/` before changing rule behaviour, and the README examples before changing an exported preset API.

## Commands

- `pnpm test` - Node test suite (`node --test`).
- `pnpm check` - the full gate: oxfmt check, oxlint with `--deny-warnings`, tests, and the peer-dependency check.
