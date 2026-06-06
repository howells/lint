# `@howells/lint`

Pinned Biome, Oxlint/Oxfmt, Ultracite, and React Doctor presets for Howells projects.

The goal is not to invent a second lint philosophy. The goal is to:

- pin a single `@biomejs/biome` version
- pin a single `oxlint` version
- pin a single `oxfmt` version
- pin a single `ultracite` version
- pin React Doctor's Oxlint plugin for React and Next.js projects on the Oxlint/Oxfmt lane
- pin a single `@manypkg/cli` version for monorepo consistency checks
- give every consumer the same small preset matrix
- discourage repo-local overrides unless the project has a genuinely unique constraint

Biome is the default toolchain. Oxlint/Oxfmt is offered as an explicit opt-in lane for JavaScript and TypeScript projects that want the Oxc stack's speed and ESLint-style rule coverage.

## Agent Setup Checklist

When configuring a project, do this in order:

1. Require Node 22.18.0+ and pnpm in the root `package.json`, and pin `.node-version` to `22.18.0`.
2. Install only `@howells/lint` as the direct lint dependency.
3. Add a `biome.json` that extends the closest presets.
4. Add read-only `lint`, mutating `lint:fix`, and optional `lint:strict` scripts.
5. If the project is a monorepo, add root workspace scripts that run `howells-workspace-check`.
6. Verify with `pnpm lint` and, when configured, `pnpm lint:strict`.

## Requirements

All projects using this package should declare the runtime and package manager explicitly:

```json
{
  "packageManager": "pnpm@10.23.0",
  "engines": {
    "node": ">=22.18.0"
  }
}
```

Also add a root `.node-version` file:

```text
22.18.0
```

Install the shared tooling:

```bash
pnpm add -D @howells/lint
```

Do not add `@biomejs/biome`, `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `oxc-parser`, or `@manypkg/cli` directly unless you are developing this package itself. They are pinned transitively here.

## Biome Presets

Choose the closest preset instead of starting from a generic base and patching it locally:

- `@howells/lint/biome/core` for Node or non-React TypeScript packages
- `@howells/lint/biome/react` for React packages
- `@howells/lint/biome/next` for Next.js apps

These presets already pin Biome and Ultracite, enable VCS ignore file support, ignore common build output directories, keep `ignoreUnknown` on for mixed repos, enforce 2-space indentation, and enable Tailwind CSS directives on DOM-oriented presets.

The shared presets exclude generated and output folders seen across Howells projects: `node_modules`, `.next`, `.turbo`, `.vercel`, `dist`, `build`, `coverage`, `out`, `storybook-static`, `playwright-report`, `test-results`, `.source`, `.cache`, `.expo`, `.output`, `.wrangler`, `.svelte-kit`, `.nuxt`, `.vite`, `.vinxi`, `dev-dist`, `tmp`, and `temp`. Keep repo-local excludes only for genuinely project-specific generated files or data directories.

Node or non-React TypeScript package:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "extends": ["@howells/lint/biome/core"],
  "root": true
}
```

React package:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "extends": ["@howells/lint/biome/core", "@howells/lint/biome/react"],
  "root": true
}
```

Next.js app:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "extends": ["@howells/lint/biome/core", "@howells/lint/biome/react", "@howells/lint/biome/next"],
  "root": true
}
```

## Oxlint/Oxfmt Presets

Use this lane when a project wants Oxlint and Oxfmt instead of Biome. React and Next presets stack the relevant Ultracite Ox rules with [React Doctor](https://react.doctor) rules in one config.

React Doctor severities are passed through as published by React Doctor. Native Oxlint Next.js severities come from Oxlint's official `nextjs` plugin via Ultracite's Next preset. `@howells/lint` adds canonical Howells policy on top for file naming, barrel files, env access, file size, function size, complexity, and tests.

The core Oxlint preset enables native Oxlint rules that keep code files navigable: `max-lines` errors above 600 non-comment, non-blank lines; `max-lines-per-function` warns above 120 non-comment, non-blank lines; `max-statements` warns above 45 statements per function; and `complexity` warns above cyclomatic complexity 15. React projects promote React Doctor's `react-doctor/no-giant-component` rule to an error, so genuinely oversized components still block CI. Test files keep the file-level `max-lines` guard but disable function-size, statement-count, and complexity limits, because test framework callbacks naturally wrap many independent cases. Generated files should be ignored at the project level; rare intentional exceptions should use an exact-file override with a short refactor note.

Choose the closest preset:

- `@howells/lint/oxlint/core` for Node or non-React TypeScript
- `@howells/lint/oxlint/react` for React (Ultracite React + React Doctor recommended rules)
- `@howells/lint/oxlint/next` for Next.js (react preset + Next.js rules)
- `@howells/lint/oxlint/boundaries` for monorepo import boundaries (`packages/**` cannot import from `apps/**`, and apps cannot import from other apps)
- `@howells/lint/oxlint/react-doctor-rules` for composing or disabling React Doctor rules in mixed workspaces

Node or non-React TypeScript:

```ts
import { defineConfig } from "oxlint";
import core from "@howells/lint/oxlint/core";

export default defineConfig({
  extends: [core],
});
```

React package:

```ts
import { defineConfig } from "oxlint";
import react from "@howells/lint/oxlint/react";

export default defineConfig({
  extends: [react],
});
```

Next.js app:

```ts
import { defineConfig } from "oxlint";
import next from "@howells/lint/oxlint/next";

export default defineConfig({
  extends: [next],
});
```

Monorepo root or package boundary config:

```ts
import { defineConfig } from "oxlint";
import {
  boundaryJsPlugins,
  boundaryRules,
  boundarySettings,
} from "@howells/lint/oxlint/boundaries";

export default defineConfig({
  jsPlugins: boundaryJsPlugins,
  settings: boundarySettings,
  rules: boundaryRules,
});
```

Run boundary configs from the monorepo root so element patterns such as `apps/*` and `packages/*` match each workspace member as a single architectural element.

Mixed monorepo with a Next.js app and Node-only packages:

```ts
import { defineConfig } from "oxlint";
import next from "@howells/lint/oxlint/next";
import { disabledReactDoctorRules } from "@howells/lint/oxlint/react-doctor-rules";

export default defineConfig({
  extends: [next],
  overrides: [
    {
      files: ["packages/**/*.ts"],
      rules: disabledReactDoctorRules,
    },
  ],
});
```

Create an `oxfmt.config.ts`:

```ts
import { defineConfig } from "oxfmt";
import howells from "@howells/lint/oxfmt";

export default defineConfig({
  extends: [howells],
});
```

Oxlint type-aware rules are available through the pinned `oxlint-tsgolint` dependency. Enable them in the root Oxlint config when the project is ready for TypeScript 7 / `typescript-go` constraints:

```ts
export default defineConfig({
  extends: [core],
  options: {
    typeAware: true,
  },
});
```

## Package Scripts

Use scripts that match the lane the project has chosen.

Biome lane:

```json
{
  "scripts": {
    "lint": "howells-lint .",
    "lint:fix": "howells-format .",
    "lint:strict": "howells-lint-strict ."
  }
}
```

Oxlint/Oxfmt lane:

```json
{
  "scripts": {
    "lint": "howells-ox-check .",
    "lint:fix": "howells-ox-fix ."
  }
}
```

The Oxlint/Oxfmt lane does not currently define a separate `lint:strict`; React Doctor's recommended rules are part of the normal Ox check.

Keep `lint` non-mutating. Put all write behavior in `lint:fix` or `format` so CI and local checks have the same semantics.

Prefer the package binaries over raw tool commands or long target lists. Use explicit script targets only when the package has a real scope constraint:

```json
{
  "scripts": {
    "lint": "howells-lint apps/web packages/ui",
    "lint:fix": "howells-format apps/web packages/ui"
  }
}
```

Use `howells-ox-fix --unsafe .` only when you deliberately want Oxlint's dangerous fixes.

## Monorepo Roots

Use workspace checks only at the monorepo root. Do not add `howells-workspace-check` to individual packages, and do not add it to single-package apps.

A monorepo root should have:

```json
{
  "packageManager": "pnpm@10.23.0",
  "engines": {
    "node": ">=22.18.0"
  },
  "scripts": {
    "lint": "turbo run lint && howells-workspace-check",
    "lint:fix": "turbo run lint:fix && howells-workspace-fix",
    "lint:strict": "turbo run lint:strict",
    "check": "pnpm lint && pnpm typecheck && pnpm test"
  },
  "devDependencies": {
    "@howells/lint": "^0.2.0"
  }
}
```

`howells-workspace-check` validates that the root declares `packageManager: "pnpm@..."`, requires Node 22.18.0+ in `engines.node`, pins `.node-version` to `22.18.0`, keeps `pnpm-workspace.yaml` present when workspace package directories exist, and passes `manypkg check`.

CI should call `pnpm lint` or `pnpm check` so root workspace checks are not bypassed by a direct `turbo lint` command.

## Binaries

Installers only need `@howells/lint` as a direct dependency. Use these package binaries:

- `howells-biome` proxies to the pinned Biome binary
- `howells-ultracite` proxies to the pinned Ultracite binary
- `howells-lint` defaults to `biome check .`
- `howells-lint-strict` runs high-signal Biome security, correctness, and suspicious lint rules
- `howells-format` defaults to `biome check . --write`
- `howells-oxlint` proxies to the pinned Oxlint binary
- `howells-oxfmt` proxies to the pinned Oxfmt binary
- `howells-ox-check` runs `oxfmt --check`, then `oxlint`
- `howells-ox-fix` runs `oxfmt --write`, then `oxlint --fix`
- `howells-workspace-check` validates root workspace hygiene, then runs `manypkg check`
- `howells-workspace-fix` runs `manypkg fix`

## Rules

- Do not add local overrides just to preserve old ESLint behavior.
- Do not create local `base`, `shared`, or `custom` Biome wrappers.
- Do not mix Biome and Oxlint/Oxfmt scripts in the same package unless the project has a deliberate migration plan.
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
- [Oxlint configuration docs](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)
- [Oxfmt configuration docs](https://oxc.rs/docs/guide/usage/formatter/config-file-reference)
- [Ultracite configuration docs](https://www.ultracite.ai/configuration)
- [React Doctor docs](https://react.doctor/docs)
