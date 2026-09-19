# What @howells/lint exports

## Oxlint presets

- `@howells/lint/oxlint/core` - Node or non-React TypeScript.
- `/oxlint/react`
- `/oxlint/next`
- `/oxlint/playwright` - an overlay for app end-to-end tests, or a standalone preset for a dedicated E2E package.
- `/oxlint/boundaries` - the workspace boundary rule alone, for configs that can't extend a standard preset.
- `/oxlint/react-doctor-rules` - compose or disable React Doctor rules in mixed workspaces.
- `/oxlint/shadcn` - the shadcn plugin and `componentSourceOverride`.
- `/oxlint/neon`

Every Oxlint preset enforces the Howells workspace convention: apps under `apps/*`, shared packages under `packages/*`, packages never import apps, apps never import sibling apps.

## Oxfmt preset

`@howells/lint/oxfmt`, a default-exported config object.

## Binaries

`howells-check` (oxfmt `--check` plus oxlint in one pass, both results reported, failing if either fails), `howells-fix` (oxfmt `--write` then oxlint `--fix`), `howells-oxlint`, `howells-oxfmt`, `howells-ultracite`, `howells-workspace-check`, `howells-workspace-fix`.

## Preset composition rules

- The Playwright export turns the Vitest rules off across the lane it governs, because Ultracite scopes them to `*.spec.*` and two of them can't be satisfied by a Playwright spec. The disable only takes effect in an override entry that also names `plugins: ["vitest"]` - Oxlint drops a rule entry whose plugin isn't in scope and reports nothing. `playwrightOverride(files)` carries all three parts; use it rather than assembling one by hand.
- The React and Next presets load the shadcn plugin and enable two of its six rules: `no-arbitrary-values` (warn, with the layout category and lone CSS-variable references allowed) and `require-static-classes` (error). Those two need no project configuration and stay silent without Tailwind. The severity split is deliberate: what survives the arbitrary-value allowances needs a judgement call, so at error it gates every upgrade behind unrelated work.
- The other four shadcn rules (`no-restyle`, `no-inline-styles`, `no-unknown-classes`, `no-raw-colors`) each enforce a policy only a consumer holds. `no-restyle` alone, with no `contracts`, was proxy-counted at roughly 1,480, 634 and 246 existing overrides in three repos, and the layout allowance wasn't measured. Don't move one into a preset.
- `componentSourceOverride(files)` stops the call-site rules at the component directory, including `require-static-classes`, which can't read a prop-forwarding wrapper and so is unsatisfiable there.
- The core preset extends Ultracite's anti-slop and Vitest rule sets, in that order after Ultracite core. Anti-slop must stay last: it disables `typescript/consistent-indexed-object-style` and `unicorn/no-immediate-mutation`, which deadlock against `anti-slop/no-known-value-widening`.

## Opt-in rules a consumer enables itself

- `howells/no-raw-jsx-elements` bans lowercase JSX host elements so markup renders only design-system components. No preset enables it; a consumer adds it with an `allow` list, and a Next root shell needs `html` and `body`.
- `howells/no-raw-type-utilities` bans Tailwind typographic utilities outside the project's own `allow` list of type tokens. Colour, alignment and wrapping aren't governed by default; add them to `match` to police them.
- The `howells` plugin is already loaded by every preset through `jsPlugins`, so a consumer only adds the rule entry.
- The four shadcn design-system rules are the other opt-in set. The plugin is loaded by the React and Next presets, so a consumer on either only adds the rule entry. A repo whose components resolve through a workspace alias also needs `settings.shadcn.ui` in its own root config: Oxlint reads `settings` from the root config only and doesn't merge it through `extends`.
