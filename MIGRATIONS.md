# Adoption Notes

Use these notes when replacing an existing ESLint, Prettier, or ad hoc Biome setup with `@howells/lint`.

## Primary rule

Do not migrate an old local lint philosophy into a new local Biome override.

Pick the closest shared preset first. Only add local config after you can explain why the repo is a real exception.

## Preset selection

- Node or non-React TypeScript: `@howells/lint/biome/core`
- React package or app without Next.js specifics: `@howells/lint/biome/react`
- Next.js app: `@howells/lint/biome/next`

If none of these fit cleanly, the likely answer is a new shared preset here, not a repo-specific fork.

## Migration steps

1. Add `@howells/lint` as a dev dependency.
2. Replace `eslint`, `next lint`, `prettier`, or direct `biome` scripts with `howells-lint` and `howells-format`.
3. Replace the project `biome.json` or `biome.jsonc` with a minimal file that only extends one shared preset.
4. Remove direct `eslint`, `eslint-config-*`, `eslint-plugin-*`, `prettier`, `@biomejs/biome`, and `ultracite` dependencies once the project is green.

## Keep local config thin

The normal local config should look like this:

```json
{
  "extends": ["@howells/lint/biome/next"]
}
```

Acceptable local additions:

- repo-specific file includes or force-ignores that cannot be expressed better in scripts
- one-off rule changes tied to a genuine platform constraint
- temporary compatibility shims during migration

Avoid:

- copying old ESLint rule customizations into Biome
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

If one repo only needs a narrower target, prefer script-level scope:

```json
{
  "scripts": {
    "lint": "howells-lint apps/web packages/ui",
    "lint:fix": "howells-format apps/web packages/ui"
  }
}
```

That is usually better than teaching the config about the repo layout.
