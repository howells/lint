# `@howells/lint`

Shared code quality toolchain package for Howells projects. It centralizes the supported linting, formatting, and workspace hygiene paths so consuming repositories do not build their own local lint philosophy.

## Language

**Code quality toolchain**:
The package boundary for `@howells/lint`: linting, formatting, lint-adjacent test linting, architecture/import boundary checks, and workspace hygiene needed to keep those tools consistent.
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

**Migration exception**:
A temporary local override used only to adopt the shared toolchain in an existing project. It should have a removal path and must not become a project preference.
_Avoid_: local preference, repo style

**Howells workspace convention**:
The default monorepo layout where apps live under `apps/*` and shared packages live under `packages/*`. Packages must not import apps, and apps must not import sibling apps.
_Avoid_: generic monorepo architecture
