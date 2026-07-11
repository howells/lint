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

Oxlint/Oxfmt is the preferred toolchain for Howells JavaScript and TypeScript projects. The Biome lane is retained for projects that need Biome compatibility or are not ready to adopt the preferred Oxlint/Oxfmt lane.

## Agent Setup Checklist

When configuring a project, do this in order:

1. Require Node 24.15.0+ and pnpm in the root `package.json`, and pin `.node-version` to `24.15.0`.
2. Install only `@howells/lint` as the direct lint dependency.
3. Add `oxlint.config.ts` and `oxfmt.config.ts` that extend the closest Oxlint/Oxfmt presets.
4. Add read-only `lint` and mutating `lint:fix` scripts.
5. If the project is a monorepo, add root workspace scripts that run `howells-workspace-check`.
6. Verify with `pnpm lint`.

## Requirements

All projects using this package should declare the runtime and package manager explicitly:

```json
{
  "packageManager": "pnpm@11.5.2",
  "engines": {
    "node": ">=24.15.0"
  }
}
```

Also add a root `.node-version` file:

```text
24.15.0
```

Install the shared tooling:

```bash
pnpm add -D @howells/lint
```

Do not add `@biomejs/biome`, `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor`, `eslint-plugin-playwright`, `oxc-parser`, or `@manypkg/cli` directly unless you are developing this package itself. They are pinned transitively here.

## Biome Presets

The Biome lane is a frozen compatibility lane. It is retained for projects that need Biome presets, and it receives dependency, breakage, and ecosystem-compatibility updates, but new Howells policy work should target Oxlint/Oxfmt first.

Choose the closest preset instead of starting from a generic base and patching it locally:

- `@howells/lint/biome/core` for Node or non-React TypeScript packages
- `@howells/lint/biome/react` for React packages
- `@howells/lint/biome/next` for Next.js apps

These presets already pin Biome and Ultracite, enable VCS ignore file support, ignore common build output directories, keep `ignoreUnknown` on for mixed repos, enforce 2-space indentation, and enable Tailwind CSS directives on DOM-oriented presets.

The shared presets exclude generated and output folders seen across Howells projects: `node_modules`, `.next`, `.turbo`, `.vercel`, `dist`, `build`, `coverage`, `out`, `storybook-static`, `playwright-report`, `test-results`, `.source`, `.cache`, `.expo`, `.output`, `.wrangler`, `.svelte-kit`, `.nuxt`, `.vite`, `.vinxi`, `dev-dist`, `tmp`, and `temp`. Keep repo-local excludes only for genuinely project-specific generated files or data directories.

Node or non-React TypeScript package:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",
  "extends": ["@howells/lint/biome/core"],
  "root": true
}
```

React package:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",
  "extends": ["@howells/lint/biome/core", "@howells/lint/biome/react"],
  "root": true
}
```

Next.js app:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",
  "extends": [
    "@howells/lint/biome/core",
    "@howells/lint/biome/react",
    "@howells/lint/biome/next"
  ],
  "root": true
}
```

## Oxlint/Oxfmt Presets

Use this lane for new Howells JavaScript and TypeScript projects. React and Next presets stack the relevant Ultracite Ox rules with [React Doctor](https://react.doctor) rules in one config.

React Doctor and native Oxlint Next.js rules now arrive through Ultracite's React and Next presets, which register the React Doctor plugin and enable its rules at error severity. `@howells/lint` adds canonical Howells policy on top for file naming, barrel files, env access, workspace boundaries, file size, function size, complexity, and tests.

The core Oxlint preset enables type-aware linting and native Oxlint rules that keep code files navigable: `max-lines` errors above 600 non-comment, non-blank lines; `max-lines-per-function` warns above 120 non-comment, non-blank lines; `max-statements` warns above 45 statements per function; and `complexity` warns above cyclomatic complexity 15. It also rejects runtime `import()` expressions, including literal specifiers, so package loading stays statically traceable. Test files keep the file-level `max-lines` guard but disable function-size, statement-count, and complexity limits, because test framework callbacks naturally wrap many independent cases. Generated files should be ignored at the project level; rare intentional exceptions should use an exact-file override with a short refactor note.

Core, React, Next, and Playwright presets also enforce the default Howells workspace convention: apps live under `apps/*`, shared packages live under `packages/*`, packages must not import apps, and apps must not import sibling apps. The rule is intentionally narrow and does not infer boundary meaning from other workspace folder names.

React and Next presets also reject generic component suffixes that tend to hide responsibility: `wrapper`, `client`, `page`, `component`, `container`, and `manager`. The rule checks `.jsx` and `.tsx` filenames and PascalCase component declarations. It allows real Next App Router `app/**/page.tsx` files and their conventional `Page` export.

Next presets reject App Router pages that only pass through to one imported client component. Route pages should keep server composition, data loading, and route-level structure in the page, then push only the interactive leaves behind a client boundary.

An opt-in `howells/no-raw-jsx-elements` rule bans raw lowercase JSX host elements (`<div>`, `<span>`, `<button>`, …) so application markup renders only design-system components. It is deliberately generic — the diagnostic carries no project-specific component names — so any project can point it at its own component vocabulary. It is **not** enabled by any preset, because banning every host element is a strong, project-specific choice that would break most consumers. The `howells` plugin is already loaded by every Oxlint preset (via `jsPlugins`), so a project turns the rule on by adding it to their own config and listing sanctioned host tags (for example the Next root shell's `html` and `body`) in the `allow` option. Uppercase components, member expressions (`Foo.Bar`), namespaced names, and fragments are always left alone.

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
  rules: {
    "howells/no-raw-jsx-elements": ["error", { allow: ["html", "body"] }],
  },
};
```

An opt-in `howells/no-raw-type-utilities` rule bans Tailwind **typographic** utilities in class strings **unless** they are sanctioned via the `allow` option — so type is styled only through a project's own design-system type classes. It is deliberately generic: it carries no project token table, and both what it governs and what it permits are supplied as params. It scans class strings with real AST scoping — `className`/`class` attributes, `cn`/`cx`/`clsx`/`cva`/`tv`/`twMerge`/`twJoin`/`classNames` call arguments, and `Record<*Size, string>` size-ladder objects — so it never fires on a same-spelled word in a comment, a JSDoc `@example`, or an unrelated string prop (a Radix `value="italic"` is untouched).

- `allow` — glob patterns (`*` wildcard) for the sanctioned classes (your design-system type tokens, plus whatever weights/leading/etc. you permit). Everything else in the governed namespace is reported.
- `match` — glob patterns for the governed namespace. Defaults to standard Tailwind typography (`text-<size>`, arbitrary `text-[…]`, `font-*`, `leading-*`, `tracking-*`, `uppercase`/`lowercase`/`capitalize`/`normal-case`, `italic`). Colour (`text-[#…]`), alignment (`text-center`), and wrapping (`text-balance`) are **not** governed by default; add them to `match` if you want them policed too.

```ts
import react from "@howells/lint/oxlint/react";

export default {
  extends: [react],
  rules: {
    "howells/no-raw-type-utilities": [
      "error",
      {
        // The ONLY typographic classes this project permits — everything else
        // in the default namespace (raw text-*, un-listed font weights, …) errors.
        allow: [
          "text-caption",
          "text-paragraph*",
          "text-subheading*",
          "text-heading*",
          "text-title",
          "text-2xs",
          "text-eyebrow",
          "font-normal",
          "font-medium",
          "font-semibold",
          "font-mono",
        ],
      },
    ],
  },
};
```

Playwright support adds the recommended `eslint-plugin-playwright` rules through Oxlint and promotes brittle E2E patterns to errors, including `playwright/no-wait-for-timeout`, `playwright/no-force-option`, `playwright/no-element-handle`, and `playwright/prefer-web-first-assertions`. Use the Playwright export as an overlay for app-level E2E tests, or as a standalone preset for dedicated E2E packages.

Choose the closest preset:

- `@howells/lint/oxlint/core` for Node or non-React TypeScript
- `@howells/lint/oxlint/react` for React (Ultracite React, which includes the React Doctor rules)
- `@howells/lint/oxlint/next` for Next.js (react preset + Ultracite Next, which includes the React Doctor Next.js rules)
- `@howells/lint/oxlint/playwright` as an overlay for Playwright E2E tests or as a preset for dedicated E2E packages
- `@howells/lint/oxlint/boundaries` for composing only the default workspace boundary rule into custom configs
- `@howells/lint/oxlint/react-doctor-rules` for composing or disabling React Doctor rules in mixed workspaces

Node or non-React TypeScript:

```ts
import core from "@howells/lint/oxlint/core";

export default {
  extends: [core],
};
```

React package:

```ts
import react from "@howells/lint/oxlint/react";

export default {
  extends: [react],
};
```

Next.js app:

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

Next.js app with Playwright E2E tests:

```ts
import next from "@howells/lint/oxlint/next";
import {
  playwrightJsPlugins,
  playwrightRules,
} from "@howells/lint/oxlint/playwright";

export default {
  extends: [next],
  jsPlugins: playwrightJsPlugins,
  overrides: [
    {
      files: ["**/*.spec.ts", "**/*.e2e.ts", "tests/**/*.{ts,tsx}"],
      rules: playwrightRules,
    },
  ],
};
```

Dedicated Playwright E2E package:

```ts
import playwright from "@howells/lint/oxlint/playwright";

export default {
  extends: [playwright],
};
```

Custom boundary-only config:

```ts
import {
  boundaryJsPlugins,
  boundaryRules,
  boundarySettings,
} from "@howells/lint/oxlint/boundaries";

export default {
  jsPlugins: boundaryJsPlugins,
  settings: boundarySettings,
  rules: boundaryRules,
};
```

Boundary rules are already part of the core, React, Next, and Playwright presets. Use the boundary-only export only when building a custom Oxlint config that cannot extend the standard presets.

Mixed monorepo with a Next.js app and Node-only packages:

```ts
import next from "@howells/lint/oxlint/next";
import { disabledReactDoctorRules } from "@howells/lint/oxlint/react-doctor-rules";

export default {
  extends: [next],
  overrides: [
    {
      files: ["packages/**/*.ts"],
      rules: disabledReactDoctorRules,
    },
  ],
};
```

Create an `oxfmt.config.ts`:

```ts
import howells from "@howells/lint/oxfmt";

export default howells;
```

The package binaries discover `oxfmt.config.*` from the current directory up through its parents and pass it to Oxfmt explicitly. If a project has no Oxfmt config, they use the packaged Howells preset directly. An explicit `--config`/`-c` flag passed to `howells-oxfmt` always wins; `howells-check` and `howells-fix` reserve their config flag for Oxlint and discover the Oxfmt config automatically.

Oxlint type-aware mode is enabled by the shared core preset through the pinned `oxlint-tsgolint` dependency. Projects choosing the Oxlint/Oxfmt lane should be ready for Oxlint's TypeScript type-aware constraints.

During migration only, a project may temporarily disable type-aware mode:

```ts
import core from "@howells/lint/oxlint/core";

export default {
  extends: [core],
  options: {
    typeAware: false,
  },
};
```

Treat this as a migration exception with a removal path, not as a normal project preference.

## Package Scripts

Use scripts that match the lane the project has chosen.

Biome lane:

```json
{
  "scripts": {
    "lint": "howells-biome check .",
    "lint:fix": "howells-biome check . --write"
  }
}
```

Oxlint/Oxfmt lane:

```json
{
  "scripts": {
    "lint": "howells-check .",
    "lint:fix": "howells-fix ."
  }
}
```

The Oxlint/Oxfmt lane does not define a separate `lint:strict`; React Doctor, type-aware Oxlint, workspace boundaries, and Playwright overlays belong in the normal check.

Keep `lint` non-mutating. Put all write behavior in `lint:fix` or `format` so CI and local checks have the same semantics.

Prefer the package binaries over raw tool commands or long target lists. Use explicit script targets only when the package has a real scope constraint:

```json
{
  "scripts": {
    "lint": "howells-check apps/web packages/ui",
    "lint:fix": "howells-fix apps/web packages/ui"
  }
}
```

Use `howells-fix --unsafe .` only when you deliberately want Oxlint's dangerous fixes.

## Monorepo Roots

Use workspace lint only at the monorepo root. Do not add `howells-workspace-check` to individual packages, and do not add it to single-package apps.

A monorepo root should have:

```json
{
  "packageManager": "pnpm@11.5.2",
  "engines": {
    "node": ">=24.15.0"
  },
  "scripts": {
    "lint": "turbo run lint && howells-workspace-check",
    "lint:fix": "turbo run lint:fix && howells-workspace-fix",
    "check": "pnpm lint && pnpm typecheck && pnpm test"
  },
  "devDependencies": {
    "@howells/lint": "^1.0.1"
  }
}
```

`howells-workspace-check` validates that the root declares `packageManager: "pnpm@..."`, requires Node 24.15.0+ in `engines.node`, pins `.node-version` to `24.15.0`, keeps `pnpm-workspace.yaml` present when workspace package directories exist, and passes `manypkg check`.

CI should call `pnpm lint` or `pnpm check` so root workspace lint is not bypassed by a direct `turbo lint` command.

## Binaries

Installers only need `@howells/lint` as a direct dependency. Use these package binaries:

- `howells-biome` proxies to the pinned Biome binary
- `howells-ultracite` proxies to the pinned Ultracite binary
- `howells-check` runs both `oxfmt --check` and `oxlint`, discovers the project Oxfmt config or uses the packaged preset, reports both results in one pass, and fails if either fails
- `howells-fix` runs `oxfmt --write`, then `oxlint --fix`, with the same Oxfmt config discovery and combined failure reporting
- `howells-oxlint` proxies to the pinned Oxlint binary
- `howells-oxfmt` proxies to the pinned Oxfmt binary with project-config discovery and packaged-preset fallback
- `howells-workspace-check` runs workspace lint, then runs `manypkg check`
- `howells-workspace-fix` runs `manypkg fix`

`howells-check` and `howells-fix` forward flags to Oxlint. Known value-taking flags work in both forms, so `howells-check --config oxlint.config.ts src` and `howells-check --config=oxlint.config.ts src` are equivalent; bare arguments are treated as lint targets.

## Rules

- Do not add local overrides just to preserve old ESLint behavior.
- Do not create local `base`, `shared`, or `custom` Biome wrappers.
- Do not mix Biome and Oxlint/Oxfmt scripts in the same package unless the project has a deliberate migration plan.
- If multiple repos need the same exception, add or adjust a preset here.
- If a repo needs framework-specific linting, choose the matching preset instead of layering rules manually.
- Prefer inline `biome-ignore` comments for truly isolated exceptions over broad config overrides.
- Keep package `lint` scripts read-only; use `lint:fix` for formatting and safe writes.
- Prefer `howells-check .` over raw tool commands or long target lists unless a package has a real scope constraint.

## Claude Code Hooks

Add this to `.claude/settings.json` so files are fixed on edit and at session end:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; case \"$file_path\" in *.js|*.ts|*.jsx|*.tsx|*.json|*.jsonc|*.css|*.graphql) howells-fix \"$file_path\" 2>/dev/null || true ;; esac; }"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git diff --name-only --diff-filter=d HEAD | grep -E '\\.(js|ts|jsx|tsx|json|jsonc|css|graphql)$' | xargs howells-fix 2>/dev/null || true"
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
