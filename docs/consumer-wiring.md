# Wiring a consumer repo

1. Install `@howells/lint` as the only direct lint dependency. Don't add `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint` or `@manypkg/cli` directly; they're pinned transitively.
2. Set `engines.node` and `packageManager` to the house versions, and add a matching root `.node-version`.
3. Add `oxlint.config.ts` extending the closest preset, and `oxfmt.config.ts` re-exporting `@howells/lint/oxfmt`.
4. Scripts: `"lint": "howells-check ."` and `"lint:fix": "howells-fix ."`. Keep `lint` non-mutating; every write goes in `lint:fix` or `format`. The Oxlint lane has no `lint:strict` - type-aware linting, React Doctor, boundaries and Playwright overlays all belong in the normal check.
5. Monorepo roots only: `"lint": "turbo run lint && howells-workspace-check"` and `"lint:fix": "turbo run lint:fix && howells-workspace-fix"`. Never put workspace lint in an individual package or a single-package app, and call `pnpm lint` rather than `turbo lint`, which bypasses it. Where packages import each other through built output, give the Turbo `lint` task `dependsOn: ["^build"]` as `typecheck` has: type-aware lint resolves sibling types from `dist`, so without it a clean clone reports errors that a machine with stale build output hides.
6. Verify with `pnpm lint`.

## Config discovery

`howells-oxfmt`, `howells-check` and `howells-fix` discover `oxfmt.config.*` upwards from the cwd and fall back to the packaged preset. An explicit `--config` on `howells-oxfmt` always wins; on `howells-check` and `howells-fix` the config flag is reserved for Oxlint.

A pinned config applies to the whole run, so formatting a directory that holds its own configs deeper down would format those packages to the outer settings. The write paths warn and name every config they bypass; run the formatter from the package directory, or name explicit paths, to use their settings.

Type-aware Oxlint is on by default. `options: { typeAware: false }` is a migration exception with a removal path, not a project preference.
