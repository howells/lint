# @howells/lint - Agent Instructions

## Communication Expectations
- Name the lint lane you are changing: Oxlint/Oxfmt, Biome compatibility, workspace lint, or package docs.
- Explain downstream impact before changing presets, rule severities, or exported binaries.
- Keep terminology aligned with `CONTEXT.md`.

## How To Work In This Codebase
- This package centralizes Howells linting, formatting, test-linting, workspace checks, and boundary checks.
- Oxlint/Oxfmt is the preferred lane; Biome is a frozen compatibility lane.
- Shared presets should absorb recurring failures, not become a repo-specific preference dump.
- Consumers should depend on `@howells/lint`, not direct pinned tool packages.

## Editing Constraints
- Do not add unrelated repo-health checks to workspace lint.
- Do not weaken shared rules for one consumer without a documented migration exception and removal path.
- Do not rename public binaries or preset exports without migration docs and tests.
- Keep output readable for agent and hook usage.

## Search Preferences
- Read `CONTEXT.md` before changing language in README or errors.
- Search tests before changing rule behavior or workspace checks.
- Search README examples before modifying exported preset APIs.

## Commands
- `pnpm test` - Node test suite.
- Package consumers should use `howells-check`, `howells-fix`, `howells-oxlint`, and `howells-oxfmt` rather than raw tool binaries.

## Repo-Specific Rules
- Preferred command names are `howells-check` and `howells-fix` for high-level project check/fix paths.
- The Howells workspace convention means apps under `apps/*`, shared packages under `packages/*`, packages do not import apps, and apps do not import sibling apps.
- Use Arc for public API changes or migrations; Mastra is not relevant here.
