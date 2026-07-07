# Adoption Notes

Use these notes when replacing an existing ESLint, Prettier, Oxlint/Oxfmt, or ad hoc Biome setup with `@howells/lint`.

## 1.0.0 breaking changes

Upgrading from a 0.x release to 1.0.0 changes four things consumers can feel:

1. **React Doctor rules are now errors.** The Oxlint React and Next presets used to spread React Doctor's published severities, which were mostly warnings. They now delegate to Ultracite's React and Next presets, which enable every React Doctor rule at `error`. A codebase that previously passed with React Doctor warnings can now fail `howells-check`/CI with no code change. This is intentional — the rules describe real correctness and performance problems. To adopt incrementally, spread `disabledReactDoctorRules` from `@howells/lint/oxlint/react-doctor-rules` (or disable specific `react-doctor/*` rules) in a project override, and treat it as a migration exception with a removal path, not a permanent preference.

2. **Node standard is 24.15.0.** `engines.node` is now `>=24.15.0`; pin `.node-version` to `24.15.0` and align the root `engines.node`. `howells-workspace-check` enforces this.

3. **Type-aware linting works from consumer projects.** Oxlint's type-aware mode needs the `tsgolint` executable, which pnpm keeps inside this package's dependency tree and out of a consumer's `node_modules/.bin` search path when run from a subdirectory or with a non-hoisting `.npmrc`. The `howells-check`, `howells-fix`, and `howells-oxlint` binaries now resolve `tsgolint` and pass it to Oxlint via `OXLINT_TSGOLINT_PATH`, so type-aware rules run reliably regardless of working directory. Run Oxlint through these binaries rather than a raw `oxlint` call to get this behavior.

4. **`howells-check` and `howells-fix` report both tools in one run.** They no longer stop at the first failing stage: the formatter check and the linter both run every time, so a single invocation surfaces every formatting and lint problem, then exits non-zero if either failed.

## Primary rule

Do not migrate an old local lint philosophy into a new local override.

Pick the closest shared preset first. Only add local config after you can explain why the repo is a real exception.

## Lane and preset selection

Choose the Oxlint/Oxfmt lane by default, then choose the closest preset in that lane. Use the Biome lane only for projects with a real Biome compatibility constraint or projects that are not ready to adopt Oxlint/Oxfmt; it is a frozen compatibility lane, not a parallel primary path.

Biome lane:

- Node or non-React TypeScript: `@howells/lint/biome/core`
- React package or app without Next.js specifics: `@howells/lint/biome/react`
- Next.js app: `@howells/lint/biome/next`

Oxlint/Oxfmt lane:

- Node or non-React TypeScript: `@howells/lint/oxlint/core`
- React package or app without Next.js specifics: `@howells/lint/oxlint/react`
- Next.js app: `@howells/lint/oxlint/next`
- Playwright E2E tests: use the Playwright export as an overlay on the app preset, or as `@howells/lint/oxlint/playwright` for a dedicated E2E package

If none of these fit cleanly, the likely answer is a new shared preset here, not a repo-specific fork.

## Migration steps

1. Add `@howells/lint` as a dev dependency.
2. Pin Node with `.node-version` set to `24.15.0` and `engines.node` set to `>=24.15.0`.
3. Replace `eslint`, `next lint`, `prettier`, direct `biome`, or direct Oxlint/Oxfmt scripts with the chosen lane's package binaries.
4. Replace local lint config with a minimal config that only extends one shared preset from the chosen lane.
5. Remove direct `eslint`, `eslint-config-*`, `eslint-plugin-*`, `prettier`, `@biomejs/biome`, `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint-plugin-playwright`, and `oxc-parser` dependencies once the project is green.

## Oxlint/Oxfmt preferred

Oxlint/Oxfmt is the preferred migration target. Biome remains available for compatibility, but new Howells projects should start on the Oxlint/Oxfmt lane.

For an Oxlint/Oxfmt project, add `oxlint.config.ts` and `oxfmt.config.ts` using the exports from `@howells/lint`, then use:

- `@howells/lint/oxlint/core` for Node or non-React TypeScript
- `@howells/lint/oxlint/react` for React (Ultracite React + React Doctor)
- `@howells/lint/oxlint/next` for Next.js (react preset + Next.js rules)
- `@howells/lint/oxlint/playwright` as an overlay for Playwright E2E tests or as a preset for dedicated E2E packages

The Oxlint/Oxfmt lane enables Oxlint type-aware mode in the shared core preset. Projects choosing this lane should be ready for Oxlint's TypeScript type-aware constraints.

If type-aware mode blocks initial adoption, temporarily override `options.typeAware` to `false` in the local config and track its removal. Treat this as a migration exception, not as a normal project preference.

Each primary Oxlint preset is self-contained. Extend only the closest primary preset — do not stack `core`, `react`, and `next` together. Treat Playwright as an overlay when E2E tests live inside an app, and as a standalone preset only for dedicated E2E packages.

```json
{
  "scripts": {
    "lint": "howells-check .",
    "lint:fix": "howells-fix ."
  }
}
```

Do not run Biome and Oxlint/Oxfmt together indefinitely. If both are present during a migration, write down which command is authoritative and remove the other once the migration is green.

## Keep local config thin

The normal local config should only extend the chosen lane's closest preset.

Biome lane:

```json
{
  "extends": ["@howells/lint/biome/next"]
}
```

Oxlint/Oxfmt lane:

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

Acceptable local additions:

- repo-specific file includes or force-ignores for generated files that are unique to one project
- one-off rule changes tied to a genuine platform constraint
- temporary compatibility shims during migration

Avoid:

- copying old ESLint rule customizations into the new lane
- broad `linter.rules` sections to preserve team habit
- local wrapper configs like `base.json` or `library.json`
- repeating the same override across multiple repos

## Promote shared patterns quickly

If the same override or ignore pattern appears in more than one active project, treat that as pressure on `@howells/lint`.

Either:

- move the shared behavior into an existing preset, or
- add a new preset with a name that describes the actual environment

Do not normalize repeated local exceptions.

## Prefer scope in scripts

If one repo only needs a narrower target, prefer script-level scope.

Biome lane:

```json
{
  "scripts": {
    "lint": "howells-biome check apps/web packages/ui",
    "lint:fix": "howells-biome check apps/web packages/ui --write"
  }
}
```

Oxlint/Oxfmt lane:

```json
{
  "scripts": {
    "lint": "howells-check apps/web packages/ui",
    "lint:fix": "howells-fix apps/web packages/ui"
  }
}
```

That is usually better than teaching the config about the repo layout.
