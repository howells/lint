# 0005. Vendor the shadcn design-system rules

`@shadcn/lint` is a vendored copy in `vendor/shadcn-lint/`, loaded by the React and Next presets. Only two of its six rules are on by default; the other four are opt-in.

It is an agent-first linter for Tailwind design systems: its diagnostics name the fix from the project's own code, which matters because agents write most of the UI in these repos.

## Why a copy

Installing it puts ESLint back in every consumer, via `@typescript-eslint/parser`, which declares ESLint as a required peer. The plugin tries `oxc-parser` first and only falls back to that parser, so `oxc-parser` is a direct dependency here and the fallback never runs. The bundle is ESM inside a CommonJS package, so `vendor/shadcn-lint/package.json` scopes the directory to `"type": "module"`; without it Oxlint refuses to parse any config that loads the plugin.

## Why only two rules are on

`no-arbitrary-values` and `require-static-classes` report a malformed class rather than a disallowed one. They need no component recognition, theme or allow list, and report nothing in a project without Tailwind. The other four each need policy this package cannot hold, and a shared preset absorbs recurring failures rather than handing every repo a backlog to suppress:

- `no-restyle` reports every existing `className` override on a recognised component unless the project writes `contracts`. Turning it on would hand consumer repos four-figure backlogs.
- `no-inline-styles` reports `style={{ y }}`, which is how Motion sets a transform.
- `no-unknown-classes` reads any unrecognised class as misspelled Tailwind, which is wrong in a project with hand-written CSS.
- `no-raw-colors` needs the project's theme to say what the alternative is.

## Consequences

A repo whose components resolve through a workspace alias puts `settings.shadcn.ui` in its own root config, because Oxlint does not merge `settings` through `extends`. `componentSourceOverride(files)` stops the call-site rules at the component directory. Upstream fixes arrive only when someone refreshes the copy (steps in `docs/internals.md`). The plugin is Tailwind v4 only.
