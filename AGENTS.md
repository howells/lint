# @howells/lint

The shared lint and format toolchain. It pins Oxlint, Oxfmt, Ultracite, React Doctor and `@manypkg/cli`, and ships the preset matrix every Howells repo extends. Consumers depend on this package, never on the underlying tools.

## Lanes

- Oxlint/Oxfmt is the only lane. 2.0.0 removed the Biome one; see `docs/adr/0003-remove-the-biome-lane.md`.
- Don't reintroduce Biome, and don't describe it as frozen or retained. A repo that still needs it stays on 1.x.
- Oxlint is the only lint engine, and ESLint is not installed. The Playwright rules are vendored in `vendor/eslint-plugin-playwright` and load through Oxlint's JS-plugin bridge; see `docs/adr/0004-vendor-the-playwright-rules.md`. GitHub and SonarJS plugins were removed in 3.0.0 to eliminate the legacy TypeScript compiler dependency.
- The shadcn design-system rules are vendored in `vendor/shadcn-lint` for the same reason: the published package depends on `@typescript-eslint/parser`, which pulls ESLint and a legacy TypeScript compiler into every consumer. See `docs/adr/0005-vendor-the-shadcn-design-system-rules.md`.

## What it exports

- Oxlint presets: `@howells/lint/oxlint/core` (Node or non-React TypeScript), `/oxlint/react`, `/oxlint/next`, `/oxlint/playwright` (overlay for app E2E tests, or standalone preset for a dedicated E2E package), `/oxlint/boundaries` (the workspace boundary rule alone, for configs that can't extend a standard preset), `/oxlint/react-doctor-rules` (compose or disable React Doctor rules in mixed workspaces), `/oxlint/shadcn` (the shadcn plugin and `componentSourceOverride`), `/oxlint/neon`.
- Oxfmt preset: `@howells/lint/oxfmt`, a default-exported config object.
- Binaries: `howells-check` (oxfmt `--check` plus oxlint in one pass, both results reported, fails if either fails), `howells-fix` (oxfmt `--write` then oxlint `--fix`), `howells-oxlint`, `howells-oxfmt`, `howells-ultracite`, `howells-workspace-check`, `howells-workspace-fix`.
- The Playwright export turns the Vitest rules off across the lane it governs, because Ultracite scopes them to `*.spec.*` and two of them cannot be satisfied by a Playwright spec. The disable only takes effect in an override entry that also names `plugins: ["vitest"]` — Oxlint drops a rule entry whose plugin is not in scope and reports nothing. `playwrightOverride(files)` is the shape that carries all three parts; use it rather than assembling one by hand.
- The React and Next presets load the shadcn plugin and enable two of its six rules: `no-arbitrary-values` (warn, with the layout category and lone CSS-variable references allowed) and `require-static-classes` (error), the two that need no project configuration and stay silent without Tailwind. The severity split is deliberate: what survives the arbitrary-value allowances needs a judgement call, so at error it gates every upgrade behind unrelated work. The other four (`no-restyle`, `no-inline-styles`, `no-unknown-classes`, `no-raw-colors`) each enforce a policy only a consumer holds, and `no-restyle` alone would report four-figure backlogs in three existing repos. Don't move one into a preset. `componentSourceOverride(files)` stops the call-site rules at the component directory.
- The core preset extends Ultracite's anti-slop and Vitest rule sets, in that order after Ultracite core. Anti-slop must stay last: it disables `typescript/consistent-indexed-object-style` and `unicorn/no-immediate-mutation`, which deadlock against `anti-slop/no-known-value-widening`.
- Every Oxlint preset enforces the Howells workspace convention: apps under `apps/*`, shared packages under `packages/*`, packages never import apps, apps never import sibling apps.

## Wiring a consumer repo

1. Install `@howells/lint` as the only direct lint dependency. Don't add `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint` or `@manypkg/cli` directly; they're pinned transitively.
2. Set `engines.node` to `>=24.15.0`, `packageManager` to `pnpm@11.5.2`, and add a root `.node-version` of `24.15.0`.
3. Add `oxlint.config.ts` extending the closest preset, and `oxfmt.config.ts` re-exporting `@howells/lint/oxfmt`.
4. Scripts: `"lint": "howells-check ."` and `"lint:fix": "howells-fix ."`. Keep `lint` non-mutating; all writes go in `lint:fix` or `format`. The Oxlint lane has no `lint:strict` - type-aware linting, React Doctor, boundaries and Playwright overlays all belong in the normal check.
5. Monorepo roots only: `"lint": "turbo run lint && howells-workspace-check"` and `"lint:fix": "turbo run lint:fix && howells-workspace-fix"`. Never put workspace lint in individual packages or single-package apps, and have CI call `pnpm lint` rather than `turbo lint`, which bypasses it. Where packages import each other through built output, give the Turbo `lint` task `dependsOn: ["^build"]` as `typecheck` has: type-aware lint resolves sibling types from `dist`, so without it a clean clone reports errors that a machine with stale build output hides.
6. Verify with `pnpm lint`.

`howells-oxfmt`, `howells-check` and `howells-fix` discover `oxfmt.config.*` upwards from the cwd and fall back to the packaged preset. An explicit `--config` on `howells-oxfmt` always wins; on `howells-check`/`howells-fix` the config flag is reserved for Oxlint.

Type-aware Oxlint is on by default. `options: { typeAware: false }` is a migration exception with a removal path, not a project preference.

## Opt-in rules a consumer enables itself

- `howells/no-raw-jsx-elements` bans lowercase JSX host elements so markup renders only design-system components. No preset enables it; a consumer adds it with an `allow` list (a Next root shell needs `html` and `body`).
- `howells/no-raw-type-utilities` bans Tailwind typographic utilities outside the project's own `allow` list of type tokens. Colour, alignment and wrapping aren't governed by default; add them to `match` if you want them policed.
- The `howells` plugin is already loaded by every preset via `jsPlugins`, so a consumer only adds the rule entry.
- The four shadcn design-system rules are the other opt-in set. The `shadcn` plugin is loaded by the React and Next presets, so a consumer on either only adds the rule entry. A repo whose components resolve through a workspace alias also needs `settings.shadcn.ui` in its own root config: Oxlint reads `settings` from the root config only and does not merge it through `extends`.

## Editing this package

- Read `CONTEXT.md` before changing language in the README, presets or error strings. `docs/adr/` records why the lanes are arranged as they are.
- Shared presets absorb recurring failures. If several repos need the same exception, change the preset here rather than the repos. A preset is not a preference dump for one repo.
- Don't weaken a shared rule for a single consumer without a documented migration exception carrying a removal path.
- Don't rename a public binary or preset export without migration docs, tests and a `MIGRATIONS.md` entry.
- Workspace lint covers package manager, runtime and workspace configuration only. Don't grow it into general repo health. It may recognise more folder names than the boundary rule, because it assigns them no import meaning.
- Keep output readable; hooks and agents parse it.
- Every binary that runs Oxlint goes through `bin/resolve-oxlint-config.mjs`. Oxlint discovers `oxlint.config.ts` and `oxlint.config.mts` and ignores `.cts`, `.js`, `.mjs` and `.cjs`, so a project writing one of the latter linted on defaults, quietly and exiting 0. Pass `--config` only for a spelling Oxlint ignores: Oxlint applies a nested config per directory, and the flag pins one config for the whole run. Don't add a packaged-preset fallback on this side; a repo with no config keeps Oxlint's defaults.
- Every binary exits through `bin/empty-target-set.mjs`. A path set that resolves to nothing after ignore rules is success, because a pre-commit hook otherwise blocks any commit of only generated or ignored files. A path named on the command line that is not on disk is still a failure. Don't add a binary that calls `runPackageBin` directly and skips this.
- Don't add a dependency that declares ESLint as a required peer: pnpm installs it in every consumer. `test/consumer-install.test.mjs` fails if ESLint appears.
- Refresh the vendored Playwright rules by copying `dist/index.cjs` and `LICENSE` from the new `eslint-plugin-playwright` tarball into `vendor/eslint-plugin-playwright/`, keeping the header comment and updating its version, then run `node bin/howells-oxfmt.mjs --write vendor` and `pnpm check`. Never edit the vendored code itself.
- Refresh the vendored shadcn rules by copying `dist/index.js`, `dist/similar.js`, `dist/tailwind-worker.js` and `LICENSE` from the new `@shadcn/lint` tarball into `vendor/shadcn-lint/`, keeping the header comments and updating their version, then run `node bin/howells-oxfmt.mjs --write vendor` and `pnpm check`. Check `cn` and `oxc-parser` still match the versions the new bundle expects. Don't copy `dist/index.d.ts`: the types here are hand-written in `oxlint/shadcn.d.mts`, and oxfmt rejects the published declaration file as an invalid ambient context. Leave `vendor/shadcn-lint/package.json` in place: the bundle is ESM and this package is CommonJS, so without it Oxlint refuses to parse any config that loads the plugin.
- Do not add a legacy TypeScript compiler dependency. Verify the installed graph and real lint fixtures when updating plugins. See MIGRATIONS.md for the 3.0.0 coverage change.
- Search `test/` before changing rule behaviour, and the README examples before changing an exported preset API.

## Commands

- `pnpm test` - Node test suite (`node --test`).
- `pnpm check` - the full gate: oxfmt check, oxlint with `--deny-warnings`, tests, and the peer-dependency check.

## Releasing

Pushing a `vX.Y.Z` tag publishes that version. `.github/workflows/release.yml` runs `pnpm check` and then `npm publish`, authenticating through npm Trusted Publishing: GitHub mints a short-lived OIDC token scoped to this repository and this workflow file, and npm exchanges it for publish rights. No token is stored in the repository or on any machine, and the account keeps `auth-and-writes` two-factor.

```sh
# on main, with the version already bumped and merged
git tag v3.2.5 && git push origin v3.2.5
```

The job packs with `pnpm pack` and publishes the resulting tarball rather than publishing the directory. npm does not understand pnpm's `catalog:` and `workspace:` specifiers, so publishing a directory from a workspace that uses them ships them unexpanded and produces a tarball nobody can install. This package has no such specifier and the packed file list is identical either way, so it costs nothing and keeps the shape correct.

Access comes from `publishConfig` in `package.json`, not a flag in the workflow.

The job fails if the tag and `package.json` disagree, so the tag is the only thing worth double-checking. Published tarballs carry provenance, which links each version on npmjs.com back to the commit and workflow run that built it.

Don't publish from a laptop. A local `npm publish` needs an interactive two-factor confirmation, produces no provenance, and leaves the registry with a version that has no run behind it.

Renaming this workflow file, or moving the repository, breaks publishing until the trusted publisher entry on npmjs.com is updated to match.
