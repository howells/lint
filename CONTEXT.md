# `@howells/lint`

Shared code quality toolchain package for Howells projects. It centralizes the supported linting, formatting, and workspace lint paths so consuming repositories do not build their own local lint philosophy.

## Language

**Code quality toolchain**: The package boundary for `@howells/lint`: linting, formatting, lint-adjacent test linting, architecture/import boundary checks, and workspace lint needed to keep those tools consistent. _Avoid_: project health toolkit, repo audit toolkit

**Extended Ultracite philosophy**: The Oxlint/Oxfmt lane starts from Ultracite and adds only narrow Howells policy for recurring project failures that upstream presets do not cover. _Avoid_: custom lint philosophy, local ESLint migration

**Oxlint/Oxfmt lane**: The only project setup path. It chooses Oxlint for linting and Oxfmt for formatting. Since 2.0.0 there is no second lane, so "lane" and "the toolchain" name the same thing. _Avoid_: Oxc mode, Ox stack, preferred lane

**Retired Biome lane**: The Biome preset path that 2.0.0 removed. A project that still needs it stays on 1.x, which keeps working and receives nothing further. Do not describe it as supported, frozen, or retained. _Avoid_: Biome lane, frozen compatibility lane, compatibility path

**Oxlint plugin bridge**: Oxlint loads Playwright, React Doctor and Howells rules through its JS-plugin mechanism. The Playwright rules are a vendored copy of `eslint-plugin-playwright`, so ESLint is not installed at all. GitHub and SonarJS plugins are retired as of 3.0.0.

**Preferred command**: A package binary that names the recommended Oxlint/Oxfmt path without aliases or fallbacks. `howells-check` and `howells-fix` are the only high-level project check/fix commands. _Avoid_: alias command, fallback command, default command

**Howells policy plugin**: The single Oxlint plugin entrypoint for local Howells rules that extend Ultracite. `oxlint/howells-policy-plugin.mjs` holds the plugin object and the component and workspace rules; the rest split by domain into sibling modules (`howells-policy-tailwind.mjs`, `howells-policy-imports.mjs`, `howells-policy-motion.mjs`), with the class-string AST scoping shared from `howells-policy-class-strings.mjs` and path matching from `howells-policy-paths.mjs`. A new rule joins the module for its domain or starts one. _Avoid_: custom lint framework

**Design-system rules**: The four `@shadcn/lint` rules that enforce a project's own policy about how its components may be restyled: `no-restyle`, `no-inline-styles`, `no-unknown-classes` and `no-raw-colors`. They are loaded by the React and Next lanes and enabled by the consumer, never by a preset. _Avoid_: shadcn preset, design lint lane

**Vendored plugin**: A rule bundle copied into `vendor/` under its own licence and loaded through Oxlint's JS-plugin bridge, because installing it would pull ESLint or a legacy TypeScript compiler into every consumer. The Playwright rules and the shadcn rules are both vendored. Never edit the copy; refresh it from a new tarball. _Avoid_: forked plugin, patched plugin

**Lint ratchet**: The `howells-ratchet` gate: a committed count of Oxlint findings per unit per rule, in `lint-baseline.json` at the repo root, which may fall but never rise. It holds a backlog for a repo whose `pnpm lint` cannot be the push gate yet, so the new rules stay on instead of being switched off. A unit is a directory whose `lint` script runs `howells-check`, and its targets are that command's arguments. _Avoid_: lint budget, error budget, allowlist, suppression file

**Migration exception**: A temporary local override used only to adopt the shared toolchain in an existing project. It should have a removal path and must not become a project preference. _Avoid_: local preference, repo style

**Howells workspace convention**: The personal-project monorepo layout where apps live under `apps/*` and shared packages live under `packages/*`. Packages must not import apps, and apps must not import sibling apps; no boundary meaning is inferred from other workspace folder names. _Avoid_: generic monorepo architecture

**Runtime dynamic import**: An `import()` expression that loads a module while code is running. The Oxlint/Oxfmt lane rejects these in favor of static imports so package loading remains statically traceable. _Avoid_: lazy import, on-demand package loading

**Workspace lint**: Checks in `@howells/lint` that lint package-manager, runtime, and workspace configuration for consistency with the shared toolchain. Workspace lint can recognize more folder names than the Howells workspace convention because it does not assign import-boundary meaning to them, and it must not expand into unrelated repo-health checks. _Avoid_: workspace hygiene, architecture policy
