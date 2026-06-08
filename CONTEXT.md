# `@howells/lint`

Shared code quality toolchain package for Howells projects. It centralizes the supported linting, formatting, and workspace lint paths so consuming repositories do not build their own local lint philosophy.

## Language

**Code quality toolchain**:
The package boundary for `@howells/lint`: linting, formatting, lint-adjacent test linting, architecture/import boundary checks, and workspace lint needed to keep those tools consistent.
_Avoid_: project health toolkit, repo audit toolkit

**Extended Ultracite philosophy**:
The Oxlint/Oxfmt lane starts from Ultracite and adds only narrow Howells policy for recurring project failures that upstream presets do not cover.
_Avoid_: custom lint philosophy, local ESLint migration

**Oxlint/Oxfmt lane**:
The preferred project setup path that chooses Oxlint for linting and Oxfmt for formatting.
_Avoid_: Oxc mode, Ox stack

**Biome lane**:
The retained compatibility path for projects that need Biome presets or are not ready to adopt the preferred Oxlint/Oxfmt lane.
_Avoid_: default lane, primary lane

**Frozen compatibility lane**:
A retained lane that receives dependency, breakage, and ecosystem-compatibility updates but does not receive new Howells policy by default.
_Avoid_: parallel primary lane

**Preferred command**:
A package binary that names the recommended Oxlint/Oxfmt path without aliases or fallbacks. `howells-check` and `howells-fix` are the only high-level project check/fix commands.
_Avoid_: alias command, fallback command, default command

**Howells policy plugin**:
The single Oxlint plugin entrypoint for local Howells rules that extend Ultracite. Rule implementations can stay together while the set is small, but should split by domain when the next local rule is added.
_Avoid_: custom lint framework

**Migration exception**:
A temporary local override used only to adopt the shared toolchain in an existing project. It should have a removal path and must not become a project preference.
_Avoid_: local preference, repo style

**Howells workspace convention**:
The personal-project monorepo layout where apps live under `apps/*` and shared packages live under `packages/*`. Packages must not import apps, and apps must not import sibling apps; no boundary meaning is inferred from other workspace folder names.
_Avoid_: generic monorepo architecture

**Workspace lint**:
Checks in `@howells/lint` that lint package-manager, runtime, and workspace configuration for consistency with the shared toolchain. Workspace lint can recognize more folder names than the Howells workspace convention because it does not assign import-boundary meaning to them, and it must not expand into unrelated repo-health checks.
_Avoid_: workspace hygiene, architecture policy
