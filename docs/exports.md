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

`howells-check` (oxfmt `--check` plus oxlint in one pass, both results reported, failing if either fails). A `!`-prefixed exclude or a quoted glob may be passed as a positional argument to any of these, and an exclude is translated into `--ignore-pattern` for Oxlint, which does not honour the positional form, `howells-fix` (oxfmt `--write` then oxlint `--fix`), `howells-oxlint`, `howells-oxfmt`, `howells-ultracite`, `howells-workspace-check`, `howells-workspace-fix`, `howells-ratchet` (the finding-count gate that may fall but never rise; see `docs/lint-ratchet.md`).

## Preset composition rules

- The Playwright export turns the Vitest rules off across the lane it governs, because Ultracite scopes them to `*.spec.*` and two of them can't be satisfied by a Playwright spec. The disable only takes effect in an override entry that also names `plugins: ["vitest"]` - Oxlint drops a rule entry whose plugin isn't in scope and reports nothing. `playwrightOverride(files)` carries all three parts; use it rather than assembling one by hand.
- The React and Next presets load the shadcn plugin and enable two of its six rules: `no-arbitrary-values` (warn, with the layout category and lone CSS-variable references allowed) and `require-static-classes` (error). Those two need no project configuration and stay silent without Tailwind. The severity split is deliberate: what survives the arbitrary-value allowances needs a judgement call, so at error it gates every upgrade behind unrelated work.
- The other four shadcn rules (`no-restyle`, `no-inline-styles`, `no-unknown-classes`, `no-raw-colors`) each enforce a policy only a consumer holds. `no-restyle` alone, with no `contracts`, was proxy-counted at roughly 1,480, 634 and 246 existing overrides in three repos, and the layout allowance wasn't measured. Don't move one into a preset.
- `componentSourceOverride(files)` stops the call-site rules at the component directory, including `require-static-classes`, which can't read a prop-forwarding wrapper and so is unsatisfiable there.
- The core preset extends Ultracite's anti-slop and Vitest rule sets, in that order after Ultracite core. Anti-slop must stay last: it disables `typescript/consistent-indexed-object-style` and `unicorn/no-immediate-mutation`, which deadlock against `anti-slop/no-known-value-widening`.

## Opt-in rules a consumer enables itself

- `howells/no-raw-jsx-elements` bans lowercase JSX host elements so markup renders only design-system components. No preset enables it; a consumer adds it with an `allow` list, and a Next root shell needs `html` and `body`.
- `howells/no-raw-type-utilities` bans Tailwind typographic utilities outside the project's own `allow` list of type tokens. Colour, alignment and wrapping aren't governed by default; add them to `match` to police them.
- `howells/no-raw-motion-namespace` bans the full animation namespace so components render the lazy primitives instead. `namespace`, `replacement` and `allowIn` are all options; `allowIn` exempts the module that owns the namespace.
- `howells/no-avoidable-arbitrary-spacing` reports an arbitrary spacing value that lands on a clean step of the scale, because it has an exact standard equivalent. `utilities` names the governed family, `step` the rem step, `allowHalfSteps` whether a half step counts as clean.
- `howells/design-token-alpha` pins a utility that mirrors a design token inline to that token's alpha. `tokens` is a list of `{ utility, alpha }` pins; with none the rule is inert. `requireAlphaSuffix` also reports a bare token carrying no alpha.
- `howells/transition-after-focus-helper` reports an unprefixed transition literal written before a helper that emits its own transition value in the same merge call. `mergeFunctions` defaults to `["cn"]`, `helpers` is required, `conflictPrefix` defaults to `transition`.
- `howells/no-deep-package-imports` keeps consumers on a package's published shim. `prefixes` is a list of `{ prefix, depth, allow }`; a subpath the target package declares literally in its own `exports` map is never reported, so `allow` is only for a package the lint run cannot resolve.
- `howells/no-out-of-bounds-package-imports` confines a dependency namespace to the directory that owns it. `packages` takes exact names or `*`-suffixed prefixes, `within` the owning directories; with either list empty the rule is inert.
- `howells/no-raw-colour-in-class-strings` bans a raw colour value inside a bracketed arbitrary class value, because it cannot answer a mode switch or be retuned centrally. `functions` names the merge helpers whose arguments are class strings, `allowFunctions` the CSS functions permitted inside the brackets (default `["var"]`), `allowIn` the paths exempt from it.
- The `howells` plugin is already loaded by every preset through `jsPlugins`, so a consumer only adds the rule entry. That holds for `shadcn` and `neon` too, which extend no other preset: a config extending a preset that lacked the entry was refused with "Plugin 'howells' not found" and linted nothing at all.
- The four shadcn design-system rules are the other opt-in set. The plugin is loaded by the React and Next presets, so a consumer on either only adds the rule entry. A repo whose components resolve through a workspace alias also needs `settings.shadcn.ui` in its own root config: Oxlint reads `settings` from the root config only and doesn't merge it through `extends`.
