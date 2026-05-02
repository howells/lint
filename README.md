# `@howells/lint`

Pinned Biome and Ultracite presets for Howells projects.

The goal is not to invent a second lint philosophy. The goal is to:

- pin a single `@biomejs/biome` version
- pin a single `ultracite` version
- pin a single `@manypkg/cli` version for monorepo consistency checks
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

Installers only need `@howells/lint` as a direct dependency. Use the package binaries instead of adding `@biomejs/biome`, `ultracite`, or `@manypkg/cli` separately:

- `howells-biome` proxies to the pinned Biome binary
- `howells-ultracite` proxies to the pinned Ultracite binary
- `howells-lint` defaults to `biome check .`
- `howells-lint-strict` runs the high-signal Biome security, correctness, and suspicious lint rules
- `howells-format` defaults to `biome check . --write`
- `howells-workspace-check` validates root workspace hygiene, then runs `manypkg check`
- `howells-workspace-fix` defaults to `manypkg fix`

Example scripts:

```json
{
  "scripts": {
    "lint": "howells-lint .",
    "lint:fix": "howells-format .",
    "lint:strict": "howells-lint-strict ."
  }
}
```

Keep `lint` non-mutating. Put all `--write` behavior in `lint:fix` or `format` so CI and local checks have the same semantics.

Monorepo root scripts should compose package linting with workspace validation:

```json
{
  "scripts": {
    "lint": "turbo run lint && howells-workspace-check",
    "lint:fix": "turbo run lint:fix && howells-workspace-fix",
    "lint:strict": "turbo run lint:strict"
  }
}
```

`howells-workspace-check` expects workspace roots to declare `packageManager: "pnpm@..."`, require Node 20+ in `engines.node`, and keep `pnpm-workspace.yaml` present when using workspace package directories.

CI should call `pnpm lint` or `pnpm check` so these root checks are not bypassed by a direct `turbo lint` command.

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
- Keep package `lint` scripts read-only; use `lint:fix` for formatting and safe writes.
- Prefer `howells-lint .` over raw `biome check` or long target lists unless a package has a real scope constraint.

## Claude Code Hooks

Add this to `.claude/settings.json` so files are formatted on edit and linted on session end:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; case \"$file_path\" in *.js|*.ts|*.jsx|*.tsx|*.json|*.jsonc|*.css|*.graphql) howells-format \"$file_path\" 2>/dev/null || true ;; esac; }"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git diff --name-only --diff-filter=d HEAD | grep -E '\\.(js|ts|jsx|tsx|json|jsonc|css|graphql)$' | xargs howells-format 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

## Upstream

This package wraps:

- [Biome configuration docs](https://biomejs.dev/reference/configuration/)
- [Ultracite configuration docs](https://www.ultracite.ai/configuration)
