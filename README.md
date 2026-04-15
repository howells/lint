# `@howells/lint`

Pinned Biome and Ultracite presets for Howells projects.

The goal is not to invent a second lint philosophy. The goal is to:

- pin a single `@biomejs/biome` version
- pin a single `ultracite` version
- give every consumer the same small preset matrix
- discourage repo-local overrides unless the project has a genuinely unique constraint

## Install

```bash
pnpm add -D @howells/lint
```

## Presets

Choose the closest preset instead of starting from a generic base and patching it locally:

- `@howells/lint/biome/core`
- `@howells/lint/biome/react`
- `@howells/lint/biome/next`

These presets already:

- pin Biome and Ultracite transitively
- enable VCS ignore file support
- ignore common build output directories
- keep `ignoreUnknown` on so mixed repos do not need defensive local config
- enforce 2-space indentation consistently
- enable Tailwind CSS directives on DOM-oriented presets

## Usage

Node or non-React TypeScript package:

```json
{
  "extends": ["@howells/lint/biome/core"]
}
```

React package:

```json
{
  "extends": ["@howells/lint/biome/react"]
}
```

Next.js app:

```json
{
  "extends": ["@howells/lint/biome/next"]
}
```

## Binaries

Installers only need `@howells/lint` as a direct dependency. Use the package binaries instead of adding `@biomejs/biome` or `ultracite` separately:

- `howells-biome` proxies to the pinned Biome binary
- `howells-ultracite` proxies to the pinned Ultracite binary
- `howells-lint` defaults to `biome check .`
- `howells-format` defaults to `biome check . --write`

Example scripts:

```json
{
  "scripts": {
    "lint": "howells-lint",
    "lint:fix": "howells-format"
  }
}
```

Prefer explicit script targets over config churn when the only difference is scope:

```json
{
  "scripts": {
    "lint": "howells-lint apps/web packages/ui",
    "lint:fix": "howells-format apps/web packages/ui"
  }
}
```

## Rules

- Do not add local overrides just to preserve old ESLint behavior.
- Do not create local `base`, `shared`, or `custom` Biome wrappers.
- If multiple repos need the same exception, add or adjust a preset here.
- If a repo needs framework-specific linting, choose the matching preset instead of layering rules manually.
- Prefer inline `biome-ignore` comments for truly isolated exceptions over broad config overrides.

## Upstream

This package wraps:

- [Biome configuration docs](https://biomejs.dev/reference/configuration/)
- [Ultracite configuration docs](https://www.ultracite.ai/configuration)
