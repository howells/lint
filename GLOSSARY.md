# `@howells/lint`

Shared code quality toolchain for Howells projects. It centralises the supported linting, formatting and workspace lint paths so consuming repositories do not build their own lint philosophy.

## Language

**Code quality toolchain**: The package boundary: linting, formatting, test linting, import boundary checks and the workspace lint that keeps them consistent. _Avoid_: project health toolkit, repo audit toolkit

**Oxlint/Oxfmt lane**: The only project setup path: Oxlint for linting, Oxfmt for formatting. Since 2.0.0 there is no second lane. The Biome lane was removed; a project that needs it stays on 1.x. _Avoid_: Oxc mode, Ox stack, Biome lane

**Extended Ultracite philosophy**: Start from Ultracite and add only narrow Howells policy for recurring failures that upstream presets do not cover. _Avoid_: custom lint philosophy

**Preferred command**: A package binary that names the recommended path without aliases or fallbacks. `howells-check` and `howells-fix` are the high-level project commands. _Avoid_: alias command, fallback command

**Howells policy plugin**: The single Oxlint plugin entrypoint for local Howells rules that extend Ultracite, in `oxlint/howells-policy-plugin.mjs`, with sibling modules split by domain. A new rule joins the module for its domain or starts one. _Avoid_: custom lint framework

**Vendored plugin**: A rule bundle copied into `vendor/` under its own licence and loaded through Oxlint's JS-plugin bridge, because installing it would pull ESLint into every consumer. Never edit the copy; refresh it from a new tarball. _Avoid_: forked plugin, patched plugin

**Design-system rules**: The `@shadcn/lint` rules that enforce a project's own policy on how its components may be restyled. Loaded by the React and Next presets; only two are enabled by default. _Avoid_: shadcn preset

**Migration exception**: A temporary local override used only to adopt the shared toolchain in an existing project. It needs a removal path and must not become a preference. _Avoid_: local preference

**Howells workspace convention**: The monorepo layout where apps live under `apps/*` and shared packages under `packages/*`. Packages must not import apps, and apps must not import sibling apps. _Avoid_: generic monorepo architecture

**Workspace lint**: Checks of package-manager, runtime and workspace configuration for consistency with the shared toolchain. It assigns no import-boundary meaning and must not grow into repo-health checks. _Avoid_: workspace hygiene

**Runtime dynamic import**: An `import()` evaluated while code runs. The lane rejects these in favour of static imports so package loading stays traceable. _Avoid_: lazy import
