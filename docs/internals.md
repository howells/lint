# Editing this package

- Read `CONTEXT.md` before changing language in the README, presets or error strings. `docs/adr/` records why the lanes are arranged as they are.
- Shared presets absorb recurring failures. Where several repos need the same exception, change the preset here rather than the repos. A preset isn't a preference dump for one repo.
- Don't weaken a shared rule for a single consumer without a documented migration exception carrying a removal path.
- Don't rename a public binary or preset export without migration docs, tests and a `MIGRATIONS.md` entry.
- Workspace lint covers package manager, runtime and workspace configuration only. Don't grow it into general repo health. It may recognise more folder names than the boundary rule, because it assigns them no import meaning.
- Keep output readable; hooks and agents parse it.
- Every binary that runs Oxlint goes through `bin/resolve-oxlint-config.mjs`. Oxlint discovers `oxlint.config.ts` and `oxlint.config.mts` and ignores `.cts`, `.js`, `.mjs` and `.cjs`, so a project writing one of the latter lints on defaults, quietly, exiting 0. Pass `--config` only for a spelling Oxlint ignores: Oxlint applies a nested config per directory, and the flag pins one config for the whole run. Don't add a packaged-preset fallback on this side; a repo with no config keeps Oxlint's defaults.
- The oxfmt side pins a config the same way, which is why `bin/resolve-oxfmt-config.mjs` also exports the shadowed-config warning the write paths emit. Keep that warning on any new write path.
- Every binary exits through `bin/empty-target-set.mjs`. A path set that resolves to nothing after ignore rules is success, because a pre-commit hook would otherwise block any commit of only generated or ignored files. A path named on the command line that isn't on disk is still a failure. Don't add a binary that calls `runPackageBin` directly and skips this.
- A lint autofix is never applied to a test file: in a test the code is the assertion, so a behaviour-preserving fix can still loosen it, and every consumer runs `howells-fix` from a pre-commit hook. `bin/howells-fix.mjs` excludes the whole class and reports on those files in a separate stage.
- Don't add a dependency that declares ESLint as a required peer: pnpm installs it in every consumer. `test/consumer-install.test.mjs` fails when ESLint appears.
- Don't add a legacy TypeScript compiler dependency. Verify the installed graph and real lint fixtures when updating plugins. `MIGRATIONS.md` carries the 3.0.0 coverage change.
- Search `test/` before changing rule behaviour, and the README examples before changing an exported preset API.

## Refreshing the vendored rules

- Playwright: copy `dist/index.cjs` and `LICENSE` from the new `eslint-plugin-playwright` tarball into `vendor/eslint-plugin-playwright/`, keeping the header comment and updating its version, then run `node bin/howells-oxfmt.mjs --write vendor` and `pnpm prepush`. Never edit the vendored code.
- shadcn: copy `dist/index.js`, `dist/similar.js`, `dist/tailwind-worker.js` and `LICENSE` from the new `@shadcn/lint` tarball into `vendor/shadcn-lint/`, keeping the header comments and updating their version, then run the same two commands. Check that `cn` and `oxc-parser` still match the versions the new bundle expects. Don't copy `dist/index.d.ts`: the types here are hand-written in `oxlint/shadcn.d.mts`, and oxfmt rejects the published declaration file as an invalid ambient context. Leave `vendor/shadcn-lint/package.json` in place, because the bundle is ESM and this package is CommonJS, so without it Oxlint refuses to parse any config that loads the plugin.
