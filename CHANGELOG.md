# Changelog

## 3.3.5 — 2026-09-18

### Fixed

- The core preset scopes `howells/no-runtime-dynamic-imports` off for test files. It and `vitest/prefer-import-in-mock`, which Ultracite's Vitest preset enables at `error`, contradict each other: `prefer-import-in-mock` demands that the module named in `vi.mock` be written as `import("./dep")`, and `no-runtime-dynamic-imports` reports every import expression, so a `vi.mock` call reported under one rule or the other whichever way it was written and neither report was clearable. That accounts for the 1,013 findings the preset bump could not clear. The dynamic-import ban exists to keep runtime package loading traceable and a test file has no runtime to trace, so it is the rule that yields, and only inside `**/*.{test,spec,test-d,spec-d}.*`, `**/__tests__/**` and the Vitest setup files. Both rules stay on everywhere else and both are now satisfiable. Covered by a preset test that lints the `vi.mock(import("./dep"), …)` form and asserts neither rule reports.
- `howells-fix` no longer applies lint autofixes to `*.test.*` or `*.spec.*` files. Those files are still linted and still formatted by oxfmt; the lint pass over them is report-only, run as a second stage after the fixing one. 3.3.4 turned two assertion-rewriting Vitest rules off after their safe autofix loosened 397 assertions across two repos, but the property that made them dangerous belongs to the file rather than the rule: Oxlint calls a fix safe when it preserves the behaviour of the code it rewrites, and in a test the code is the assertion. Consumers run `howells-fix` from a pre-commit hook, so any fix landing in a test file lands unreviewed. Covered by a binary test asserting that a fixable finding in a `.test.mjs` file is reported and the file left byte-for-byte unchanged.

### Notes

- Nothing under `bin/` writes, renames or deletes an rc file. `bin/resolve-oxlint-config.mjs:30` names `.oxlintrc.json` and `.oxlintrc.jsonc` only to test for their existence during upward config discovery, and every filesystem call in `bin/` is `existsSync`, `readdirSync` or `readFileSync`. A named rc file such as `.oxlintrc.barrels.json` is neither discovered nor touched by this package.

## 3.3.4 — 2026-09-17

### Fixed

- The core preset turns off `vitest/prefer-to-be-truthy` and `vitest/prefer-to-be-falsy`. Their autofixes rewrite `toBe(true)` to `toBeTruthy()` and `toBe(false)` to `toBeFalsy()`, which is a different assertion: `toBe(true)` fails on the string `"yes"` and on `1`, and `toBeTruthy()` passes both. A test that pinned an exact boolean came out of `howells-fix` accepting anything truthy, and because consumers run `howells-fix` from a pre-commit hook, the rewrite landed in a commit nobody reviewed. Measured: 276 assertions rewritten in colorscope, 121 in motif, one of which broke an env test. Severity was no defence - motif had both rules at `warn` and its tests were rewritten anyway - and Oxlint classes both fixes as safe, so `--fix` applies them and only `--fix-dangerously` is gated. Covered by a preset test that asserts the fixer's output rather than the rule table, so a later Ultracite bump cannot reintroduce it quietly.

### Notes

- Consumers that hand-patched around this can drop their local overrides once they are on 3.3.4: candor turned both rules off in `oxlint.compatibility.config.mjs`, motif downgraded them to `warn` in its root `oxlint.config.ts`.

## 3.3.3 — 2026-09-16

### Changed

- `howells-check`, `howells-fix` and `howells-oxlint` print a one-line warning when no `oxlint.config.*` exists in the working directory or any parent. The run still uses Oxlint's defaults, as before; nothing is imposed. A sweep of one machine on 2026-09-16 found ten repos depending on this package with no config anywhere, each linting on the defaults and each looking, from its green `pnpm lint`, exactly like a repo on the preset. The same sweep found five repos on `oxlint.config.mjs`, which 3.3.0 already reports. Covered by a binary test.

## 3.3.2 — 2026-09-16

### Changed

- `componentSourceOverride` also turns off `shadcn/require-static-classes` inside the component directory. The rule cannot read a forwarding wrapper: `const { className, ...rest } = props` followed by `<Badge {...rest} />` reports on the rest element, because the rule does not see that `className` was destructured out. That is the shape of every component in a design-system directory, so the rule is unsatisfiable there. Measured in patternmode, where it was the single finding blocking the 3.2.5 upgrade and needed a bespoke override. Upstream's own Oxlint preset, shipped in Ultracite 7.12, turns it off in the component directory for the same reason. Call sites keep the rule.

### Notes

- Ultracite 7.12 ships `ultracite/oxlint/shadcn`. It does not replace the vendored copy here: it names `@shadcn/lint` by package and expects the consumer to install it, and that package hard-depends on `@typescript-eslint/parser`, whose required peer is ESLint. A fresh install still lands ESLint 10.10.0 and TypeScript 6.0.3. The parser is only a fallback the plugin reaches when `oxc-parser` is absent, so the upstream fix is small and is tracked at shadcn-ui/lint#1. When it lands, the vendored copy can go.

## 3.3.1 — 2026-09-15

### Fixed

- `howells-check`, `howells-fix`, `howells-oxlint` and `howells-oxfmt` no longer die with `ENOBUFS` on a large finding set. The binaries capture each tool's output through `spawnSync` to tell an empty path set apart from a real failure, and `spawnSync` kills the child once that capture exceeds `maxBuffer` - 1MB by default. A monorepo package carrying a lint backlog of tens of thousands of findings produces tens of megabytes of output, so the wrapper crashed precisely where a repo needed it working. The capture buffer is now 256MB, which holds any plausible finding set and still catches a runaway child.

## 3.3.0 — 2026-09-15

### Fixed

- `howells-check`, `howells-fix` and `howells-oxlint` now apply an `oxlint.config.*` that Oxlint does not discover on its own. Measured against the pinned Oxlint, `oxlint.config.ts` and `oxlint.config.mts` are found; `oxlint.config.cts`, `.js`, `.mjs` and `.cjs` are not. A project writing one of the latter got no preset, no plugins and no rules, and the run stayed quiet and exited 0, so nothing announced that the config had never been read. One consumer repo had 26 such files and had been linting on Oxlint's defaults throughout.

  The binaries now walk up from the working directory the way the Oxfmt side already did, and pass `--config` only for a spelling Oxlint ignores. A spelling Oxlint finds is left alone deliberately: Oxlint applies a nested config to the directory it sits in, and `--config` pins one config for the whole run, which would flatten a monorepo where each package configures itself. An explicit `--config` still wins, and a project with no config at all keeps Oxlint's defaults.

  Passing the flag costs that nested behaviour, so the run prints a one-line warning naming the rename to `oxlint.config.ts` that restores it.

  **Expect new findings.** A repo whose config was never read has a backlog it has never seen. Take this upgrade on its own, with someone watching it.

## 3.2.5 — 2026-09-15

### Changed

- Releases publish from GitHub Actions. Pushing a `vX.Y.Z` tag runs `pnpm check` and then `npm publish`, authenticating through npm Trusted Publishing: GitHub mints a short-lived OIDC token scoped to this repository and `.github/workflows/release.yml`, and npm exchanges it for publish rights. No token is stored in the repository or on any machine, the account keeps `auth-and-writes` two-factor, and no release waits on someone being at a browser to approve it.

  Published tarballs now carry provenance, so each version on npmjs.com links back to the commit and the workflow run that built it.

  3.2.3 and 3.2.4 were tagged but never reached the registry, because every publish needed an interactive confirmation. Their changes are in this release; going from 3.2.2 to 3.2.5 skips nothing.

## 3.2.4 — 2026-09-15

### Changed

- `shadcn/no-arbitrary-values` warns rather than errors. What survives the layout and variable allowances is a real signal with legitimate exceptions: `rounded-[3px]` is a mechanical fix, `rounded-[min(1vw,12px)]` is a fluid radius with no scale to move to, and `transition-[outline-color]` names a CSS property rather than a design value. A repo cannot reach zero without a judgement call or a suppression, so at error severity the rule gated every upgrade behind unrelated work, including the upgrade that removes ESLint. Core already takes this position for `complexity`, `max-lines-per-function` and `max-statements`.

  `howells-check` does not pass `--deny-warnings`, so a warning prints with its suggested replacement and exits 0. Add `--deny-warnings` in CI to make it blocking, or raise the rule to `error` in a repo whose design system is tight enough to hold it.

  `shadcn/require-static-classes` stays at error. It reports a className no rule can read, there are roughly 50 across every consumer repo, and each has a mechanical fix.

### Fixed

- The binaries set `process.exitCode` instead of calling `process.exit()`. They capture each tool's output and re-emit it, and a write to a pipe is asynchronous, so `process.exit()` discards whatever has not drained: measured at a 64KB truncation. No finding was observed lost in practice, since Oxlint's output is well under that in the repos checked, but a large enough finding set would have lost the tail silently, and Oxlint writes findings to stderr where the loss would not have changed the reported status.

## 3.2.3 — 2026-09-15

### Changed

- `shadcn/no-arbitrary-values` now allows the `layout` category. The layout values repos actually write have no token to move to: a reading measure (`max-w-[68ch]`), a grid track (`grid-cols-[minmax(0,1fr)_392px]`), a fluid offset (`top-[clamp(1.5rem,5vw,5rem)]`). Tailwind has no scale for any of them, so the rule at error severity was unsatisfiable and blocked the upgrade instead of improving the design system. It is also the allowance upstream's own quickstart uses.

  Appearance keeps every check, which is where an off-token value is a real problem. `rounded-[3px]`, `bg-[#ec4899]`, `text-[19px]` and `shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]` all still report, and the message still names the scale value or theme colour to use.

  The cost is that a width with an exact scale equivalent, `w-[280px]` for `w-70`, now passes. A repo that wants those back drops `layout` from the allow list in its own config.

  Measured: this takes quarry from 10 errors to 0, and clears the grid, clamp and measure findings that made up most of colorscope's 134.

## 3.2.2 — 2026-09-15

### Fixed

- `howells-oxfmt`, `howells-oxlint` and `howells-check` no longer fail when the path set resolves to nothing after ignore rules. A commit whose staged files are all generated data that the tools ignore made every one of them exit non-zero, so a pre-commit hook blocked any regenerate-only commit and the only way through was `--no-verify`, which switches off every other check with it. `howells-fix` already treated an empty set as success; that logic now lives in `bin/empty-target-set.mjs` and all four share it.

  A path named on the command line that is not on disk still fails, so a typo is still an error rather than a silent pass. A genuine formatting or lint failure is unchanged.

- `shadcn/no-arbitrary-values` no longer reports a variable reference written with one of Tailwind's type hints, `text-[length:var(--cs-text-small)]`. The hint tells Tailwind how to read the variable and adds no value of its own, so it is the same token reference 3.2.1 exempted in its bare spelling.

  A composite still reports: `border-[color:color-mix(in_oklab,var(--cs-border)_60%,transparent)]`, `bg-[color-mix(…)]` and `shadow-[inset_0_0_0_1px_var(--cs-text)]` all carry hardcoded parts.

### Changed

- The four binaries share one exit path, so the message printed when a path set is empty is now `nothing to do` in all of them. `howells-fix` previously said `nothing to fix`. Adjust anything that greps for the old wording.

## 3.2.1 — 2026-09-15

### Fixed

- `shadcn/no-arbitrary-values` no longer reports a class whose arbitrary value is one CSS variable reference. `text-[var(--cs-text)]` reads a design token, so calling it an off-token value inverted the rule, and its suggested fix, to use a theme token, was what the class already did. Upstream passes Tailwind v4's `text-(--cs-text)` shorthand for the same thing, which makes the bracket form an inconsistency rather than a policy. Measured in a repo whose design system is entirely `--cs-*` custom properties, this was 1,890 of 2,024 findings, and it took a clean package to 2,062 errors on upgrade.

  A value that merely contains a variable still reports, because it still carries hardcoded parts: `shadow-[0_0_0_1px_var(--cs-border)]` and `p-[calc(var(--gap)*2)]` are both unchanged. Variant and important forms follow the class they qualify.

  A repo with many arbitrary track expressions (`grid-cols-[minmax(0,1fr)_20rem]`, `top-[clamp(…)]`) still sees those. They are real findings with two real fixes: name the track in `@theme`, or pass `allow: ["layout"]` to the rule in your own config.

## 3.2.0 — 2026-09-15

### Added

- `@shadcn/lint` 0.1.0, an agent-first linter for Tailwind design systems, vendored into `vendor/shadcn-lint/` and loaded by the React and Next presets. Its diagnostics name the fix from the project's own code: a `p-4` on a Button reports the sizes that Button declares and the file they live in. It is vendored for the same reason the Playwright rules are: the published package depends on `@typescript-eslint/parser`, which declares ESLint as a required peer, and a fresh consumer install measured `eslint@10.10.0` and `typescript@6.0.3` because of it. See `docs/adr/0005-vendor-the-shadcn-design-system-rules.md`.
- Two of its rules at error severity in the React and Next lanes: `shadcn/no-arbitrary-values`, which rejects an off-token value such as `p-[13px]` and names the scale value that matches, and `shadcn/require-static-classes`, which rejects a `className` the linter cannot read. Both report a malformed class rather than a disallowed one, so both stay silent in a project without Tailwind.
- `@howells/lint/oxlint/shadcn`, exporting the plugin, the enabled rules, the names of the four opt-in ones, and `componentSourceOverride(files)`, which stops the call-site rules at the component directory so a component can style its own internals.
- `cn` 0.2.6 and `oxc-parser` 0.148.0, the two dependencies the vendored bundle needs. Neither declares an ESLint peer. `oxc-parser` is what keeps the plugin off its `@typescript-eslint/parser` fallback.

### Changed

- The version pin in `package.json` only. No preset export, binary or existing rule changed.

## 3.1.0 — 2026-09-11

### Removed

- ESLint is no longer installed, here or in any consumer. The Playwright rules now load from a vendored copy of `eslint-plugin-playwright` 2.11.0, because the published package declares ESLint as a required peer and pnpm installs it automatically. The rules and the `@howells/lint/oxlint/playwright` exports are unchanged. See `docs/adr/0004-vendor-the-playwright-rules.md`.
- The direct `oxc-parser` pin. Nothing imports it, and React Doctor now resolves its own copy.

### Changed

- Oxlint 1.80.0 to 1.82.0, Oxfmt 0.65.0 to 0.67.0, Ultracite 7.10.6 to 7.11.1, React Doctor 0.9.12 to 0.9.13, `@howells/neon` 0.1.1 to 0.2.0. Ultracite 7.11.1 needs Oxlint 1.82: it passes `checkConditionalExpressions` to `no-unmodified-loop-condition`, which older Oxlint refuses to parse.
- The Next preset's route-export allowlist follows Next.js 16.3.4. It adds `instant` and `prefetch`, the route segment exports introduced in 16, and drops `experimental_ppr`, which 16 removed. `instant` needs the entry in its object form (`{ level: "warning" }`), which the constant-export allowance does not cover.
- From Ultracite 7.11.1: `no-unmodified-loop-condition` now checks each branch of a ternary loop condition; `unicorn/no-nested-ternary` is off, because its fix fights Oxfmt, and core `no-nested-ternary` still reports the construct; `unicorn/prefer-reflect-apply` is off, because it contradicts `no-reflect-apply`; and the test-file globs now cover Vitest type tests (`*.test-d.*`, `*.spec-d.*`).

## 3.0.0 — 2026-09-07

### Removed

- The GitHub and SonarJS JS plugins and the 188 rules they supplied to the core preset. Their latest versions still require the legacy TypeScript compiler API; type-aware checks continue through oxlint-tsgolint. See MIGRATIONS.md.

### Fixed

- `howells/no-raw-type-utilities` now governs a size written with the important marker after its variant. `baseUtility` stripped a leading `!` before splitting on the variant colon, so `hover:!text-xl` reduced to `!text-xl`, matched no glob, and was reported by nothing - while the bare `!text-xl` was caught. The marker now comes off after the split, covering all three positions Tailwind allows.

- Tailwind v4's CSS-variable shorthand `text-(length:--my-size)` is now governed. It is shorthand for `text-[length:var(--my-size)]`, so it is always a size, but the colon inside its parentheses split the token because depth counted only brackets. Depth now counts parentheses too, which also keeps `text-[calc(1rem/2)]` whole.

- `howells/no-raw-type-utilities` now governs a size carrying Tailwind v4's suffix `!` or a leading modifier. `baseUtility` stripped only v3's prefix `!`, so `text-xl!` and `text-2xl/8` reduced to themselves, matched no glob in the namespace, and were reported by nothing - while `!text-xl` was caught. A size is a size however it is shouted or paired with a leading, and both suffixes are now stripped at depth zero, leaving `text-[calc(1rem/2)]` intact.

- Arbitrary colours written as `text-[color:var(--x)]` or `text-[color-mix(…)]` are no longer reported by this rule. `ARBITRARY_COLOUR_PATTERN` matched the functional `color(` but not the `color:` type hint or the `color-mix()` blend, so both fell through to the size namespace and drew a typography finding on a colour. Colour remains the colour rule's territory.

### Changed

- `howells/no-raw-type-utilities` now gives an arbitrary size (`text-[13px]`) its own fix, separate from a named one: use the nearest step on the scale, or add a named step to `@theme`. A one-off pixel value names nothing, so the next file writes its own and the ramp grows a step nobody chose. The escape hatch stays open via `allow`.

## 2.1.0 — 2026-08-20

### Added

- `playwrightOverride(files)`, `vitestRulesOff`, and `playwrightPlugins` on `@howells/lint/oxlint/playwright`. `playwrightOverride` returns a complete Oxlint override entry for an app's E2E globs - the Playwright rules, Ultracite's Vitest rules off, and `plugins: ["vitest"]` - and is now the documented overlay shape. `playwrightRules` and `playwrightJsPlugins` are unchanged and still exported.

### Fixed

- The Playwright lane no longer draws Vitest findings. **This is a 2.0.0 regression.** Before that release the core preset carried `vitest` in its top-level `plugins` and named twelve rules at top level, where a consumer's later `"vitest/x": "off"` could reach them. 2.0.0 replaced that with Ultracite's Vitest preset, which is a single `overrides` entry scoped to `*.test.*`, `*.spec.*`, and `__tests__` - and an override beats top level for the files it matches, so the disable stopped working. A Playwright spec is named the same way under either convention, so the whole Vitest set now applies to E2E tests and lints them against a runner that is not there.

  `vitest/prefer-importing-vitest-globals` is the rule that bites in practice. It matches on the _names_ `expect` and `test` rather than on the import source, so it fires on a correctly imported Playwright `expect` and no call site can satisfy it; aliasing both imports silences it but blinds `sonarjs/no-empty-test-file`, which then reports the spec has no tests, trading one finding for a worse one. `vitest/consistent-test-filename` is the second - it demands `.spec.ts` be renamed to `.test.ts`. Playwright's own default `testMatch` accepts both spellings, so that one only conflicts in a repo whose config pins `.spec.ts` by name.

  The exemption is read out of Ultracite's own preset rather than listed by hand, so a Vitest rule added upstream is covered without this package being touched. It is scoped by path: a Vitest test outside the Playwright globs keeps every rule, and `sonarjs/no-empty-test-file` still reports a genuinely empty spec. Both are held by tests.

  The disable has to carry `plugins: ["vitest"]` wherever it lands. Oxlint resolves a rule entry against the plugin set in scope at that point, and `vitest` is absent from the core preset's top-level `plugins` - Ultracite enables it inside its own override. Without the plugin named, `"vitest/x": "off"` is discarded without a word, at top level and inside an override alike; that silence is why this looked unfixable from a consumer's config. A test holds the broken shape and asserts the findings survive it, so the fix cannot rot into a no-op.

  Only a consumer on 2.0.0 that lints its E2E directory is affected. A repo still on 1.x or 0.x inherits this the moment it upgrades.

## 2.0.0 — 2026-08-15

### Removed

- **The Biome lane.** The `@howells/lint/biome/core`, `/biome/react` and `/biome/next` presets, the `howells-biome` binary, and the `@biomejs/biome` dependency are gone. Oxlint/Oxfmt is the whole toolchain. Seven repositories held a `biome.json` extending these presets at the point of removal, but only two still ran Biome from a `lint` script - the other five had already moved to `howells-check` and left dead config behind. This ships as a major precisely so nothing is taken by surprise: a consumer only crosses 2.0.0 by asking for it, and 1.x keeps working for as long as a project stays there. `docs/adr/0003-remove-the-biome-lane.md` records the reasoning; `docs/adr/0002` is marked superseded rather than deleted.

ESLint is unaffected and is not going anywhere. It is not a lane and never was: `eslint-plugin-github`, `eslint-plugin-sonarjs` and `eslint-plugin-playwright` run _inside_ Oxlint through its JS-plugin bridge, and account for 188 of the core preset's 678 enabled rules plus all 36 in the Playwright preset. The pinned `eslint` dependency is the runtime they resolve against.

### Added

- The core preset carries Ultracite's build of the [anti-slop](https://github.com/dmmulroy/anti-slop) plugin, so React, Next and Playwright inherit it. It rejects the low-evidence TypeScript that turns up when code is written fast: type assertions with no stated reason, `unknown` in parameters and returns, `Reflect.get`/`Reflect.apply` property access, module mocking, widen-then-assert. No new dependency - the plugin is unpublished upstream and Ultracite vendors a bundled build. It is extended last, after Ultracite's core preset, because it disables `typescript/consistent-indexed-object-style` and `unicorn/no-immediate-mutation`, which deadlock against `anti-slop/no-known-value-widening` - the autofix of one produces the input of the other. Nothing after core turns them back on, so React and Next inherit the resolution too.
- The core preset carries Ultracite's Vitest rules, scoped by upstream to `*.test.*`, `*.spec.*`, and `__tests__` files. This replaces the twelve rules this package hand-rolled at top level with roughly sixty, and picks up the conflict resolutions Ultracite maintains against them (`valid-title` off against `prefer-describe-function-title`, `prefer-called-times` off against `prefer-called-once`, and so on). Vitest rules no longer apply outside test files, which is where they were always inert anyway.

### Changed

- Refresh the toolchain: Ultracite 7.10.5, Oxlint 1.78.0, Oxfmt 0.63.0, React Doctor's Oxlint plugin 0.9.12, `oxc-parser` 0.144.0. The JS-plugin bridge set (GitHub 6.1.2, SonarJS 4.2.0, Playwright 2.11.0) and `oxlint-tsgolint` 7.0.2001 are unchanged and already current.

### Fixed

- The Next preset accepts a route file's segment exports again. React Doctor 0.9.x rewrote its port of the react-refresh rule with a stripped-down default - no framework detection, no route-file awareness - so under 0.9.12 every `page.tsx` exporting `metadata`, `dynamic`, `revalidate`, or `generateStaticParams` alongside its component reported itself as unsafe for Fast Refresh. Upstream's remedy is `settings: { "react-doctor": { portedRuleMode: "curated" } }`, which a shared preset cannot deliver: Oxlint reads `settings` from the root config only and does not merge it through `extends`, so it would have to be pasted into every consumer's own `oxlint.config.ts`. The React preset keeps React Doctor's default, which is the genuine react-refresh contract. The Next preset turns the ported rule off and runs Oxlint's native `react/only-export-components` with an allowlist of Next's route-segment export names - rule options, unlike `settings`, do flow through `extends`.

### Notes

- Oxlint 1.78.0 no longer lints a path it considers ignored - `node_modules`, any dot-prefixed directory, anything matched by `.gitignore` - even when that path is named explicitly on the command line, and `--no-ignore` does not lift it. It reports "No files found to lint" instead. This package's own preset fixtures lived under `node_modules` for plugin resolution and now run from a temp directory with a `node_modules` symlink. A consumer linting a hidden directory (`.storybook`, `.github/scripts`) will see the same silence; `howells-check` surfaces it as "Expected at least one target file".
- ESLint stays on 9.39.5 and TypeScript on 6.0.3. Both holds were rechecked against this refresh and both still stand for the reasons given in 1.2.0: `eslint-plugin-github` still pulls `eslint-plugin-import@2.32.0` and `eslint-plugin-jsx-a11y@6.10.2`, neither of which admits ESLint 10, and `@typescript-eslint/utils` still declares peer `typescript >=4.8.4 <6.1.0`.

## 1.2.1 — 2026-08-13

### Fixed

- The React and Next presets accept the casing React and Next.js require. `sonarjs/function-name` defaults to `^[_a-z][a-zA-Z0-9]*$` and Ultracite enables it - SonarJS itself ships it disabled in `recommended` - so in a React lane it fired on the one place the ecosystem _mandates_ PascalCase, and in a Next lane it fired on names the framework dispatches on and which therefore cannot be renamed at all: `GET`, `POST`, `PATCH`, `DELETE`. This made 1.2.0's Next relaxation self-contradicting: the preset deliberately re-allowed `export default function Page()` and then rejected the name `Page`. Measured on a ~460-file consumer app it was 70 errors, none of them fixable in the app - 55 route-handler exports and 15 components; with the fix, zero. The format widens to camelCase or PascalCase in the React preset and is inherited by Next. `core` keeps the strict default: a lowercase JSX tag resolves to an intrinsic element, so the exemption is meaningless outside a React lane and should not leak into Node packages. Two tests cover it, including that `_Mixed_Up` is still rejected - the rule is widened, not switched off - and that `core` still rejects PascalCase.

## 1.2.0 — 2026-08-03

### Changed

- Refresh the Oxlint/Oxfmt lane: Ultracite 7.10.0, Oxlint 1.76.0, Oxfmt 0.61.0, React Doctor's Oxlint plugin 0.9.3, `oxc-parser` 0.142.0, Biome 2.5.6, and the JS-plugin bridge set (GitHub 6.1.2, SonarJS 4.2.0, Playwright 2.11.0). Oxlint 1.76.0 declares a hard peer on `oxlint-tsgolint` `>=7.0.2001`, so tsgolint moves from 0.24.0 to 7.0.2001 with it - a renumbering, not 7 majors of change.
- The Next preset relaxes Ultracite's new `react/function-component-definition` to accept the function-declaration form for named components. Upstream requires arrow functions; Next.js requires a default export from every page, layout, and error boundary and writes it as `export default function Page()`, so the arrow-only form makes the framework's own generated code unlintable. The relaxation is narrower than it reads: core's `func-style` still rejects named function declarations that are not default exports, so this frees the shape Next.js mandates and nothing else. The React preset keeps upstream's arrow-only position.
- The React preset no longer carries React Doctor's TanStack Start rules. Ultracite moved them behind an opt-in preset because several fire on generic JSX - `tanstack-start-no-anchor-element` rejects a plain `<a>` - and this lane targets Next.js. The `query-*` rules stay, since they only match TanStack Query's own API and cannot fire in a repo that never calls it.

### Fixed

- Restore React Doctor's 23 `react-doctor/nextjs-*` rules to the Next preset. Ultracite 7.10.0 moved them out of `ultracite/oxlint/js-plugins` into a separate opt-in preset, which silently emptied the Next.js set from this package's presets - every consumer would have kept passing CI while losing the rules that catch a raw `<img>`, a missing `sizes`, an async client component, or a redirect inside `try`/`catch`. The Next preset now extends Ultracite's Next JS-plugin preset directly, and a test asserts the rules arrive.
- The `disabledReactDoctorRules` escape hatch derives from the presets this package actually enables rather than from the plugin's static exports, so it stays complete when Ultracite next moves rules between its JS-plugin presets.

### Notes

Both of these are deliberate holds, not oversights. The caps are cited so the next refresh can re-check them directly instead of rediscovering why.

- ESLint stays on 9.39.5. ESLint 10.8.0 is published and all three direct plugins accept it - `eslint-plugin-github@6.1.2` and `eslint-plugin-sonarjs@4.2.0` both declare `^10`, `eslint-plugin-playwright@2.11.0` declares `>=8.40.0`. It was tried and reverted: `eslint-plugin-github` still pulls `eslint-plugin-import@2.32.0` (peer `^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9`) and `eslint-plugin-jsx-a11y@6.10.2` (peer `^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9`), neither of which admits ESLint 10, and `pnpm peers check` fails on both. Moving now would reintroduce the broken peer graph 1.1.0 repaired. Recheck when those two ship an ESLint 10 peer.
- TypeScript stays on 6.0.3, the newest published 6.x. TypeScript 7.0.2 is published, but the JS-plugin bridge caps below it: `@typescript-eslint/utils@8.65.0` - Ultracite's own dependency, and the runtime the bridge loads - declares peer `typescript >=4.8.4 <6.1.0`, and `eslint-plugin-sonarjs@4.2.0` depends on `typescript >=5 <6.1.0`. Recheck when `@typescript-eslint` lifts its cap past 6.1.

## 1.1.2 — 2026-07-17

### Fixed

- The Oxlint core preset turns off core `require-await`. Ultracite enables it alongside typed `typescript/promise-function-async`, and together they contradict: the typed rule forces `async` onto every promise-returning function, and core `require-await` then rejects any of them with nothing to await - making a no-await implementation of a promise-typed signature (test stubs, passthrough adapters) unwritable. The typed rule carries the intent; the untyped one yields. Covered by a preset regression test.

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
