# Vendor the shadcn design-system rules

`@shadcn/lint` joins the toolchain as a vendored copy in `vendor/shadcn-lint/`, loaded by the React and Next presets. Two of its six rules are on by default. The other four stay opt-in.

It is an agent-first linter for Tailwind design systems. Its diagnostics name the fix from the project's own code: a `p-4` on a Button reports the sizes that Button declares and the file they live in. That is worth more here than the rule itself, because agents write most of the UI in these repos and a rule they cannot act on just costs a round trip.

## Why the copy

Installing it puts ESLint back in every consumer. `@shadcn/lint` depends on `@typescript-eslint/parser`, which declares ESLint as a required peer, and pnpm installs required peers. Measured in a fresh consumer: `eslint@10.10.0` and `typescript@6.0.3`, the same two packages [0003](0003-remove-the-biome-lane.md) and 3.0.0 spent two releases removing.

The parser is a fallback. The plugin tries `oxc-parser` first and only reaches `@typescript-eslint/parser` if that resolve fails, so `oxc-parser` is a direct dependency here and the fallback never runs. `cn` is the other dependency the bundle needs, and it has none of its own.

The bundle is ESM inside a CommonJS package, so `vendor/shadcn-lint/package.json` scopes that directory to `"type": "module"`. Without it Oxlint fails to load the plugin and refuses to parse the whole config. `test/consumer-install.test.mjs` lints a `.tsx` file through the packed tarball, so a missing vendor file or a returning ESLint fails the suite.

## Why only two rules are on

`no-arbitrary-values` and `require-static-classes` report a malformed class rather than a disallowed one. Neither needs component recognition, a theme, or an allow list, and neither reports anything in a project without Tailwind: measured against a React fixture of CSS-module and BEM class names, both stayed silent, while `no-arbitrary-values` still named the scale value for `p-[13px]` with no `tailwindcss` installed.

The other four each need a policy this package cannot hold.

`no-restyle` is the reason to adopt the plugin and the one that cannot ship on. With no `contracts` it reports every existing `className` override on a recognised component at once. Counted across the consumer repos by proxy: roughly 1,480 call sites in `materia`, 634 in `materialdesk`, 246 in `materialgraph`. Turning it on from here would hand three repos a four-figure backlog on a patch upgrade.

`no-inline-styles` collides with Motion. It reports `style={{ y }}`, which is how Motion sets a transform, and a CSS custom property is not a substitute for it. The same repos carry 299, 266 and 211 inline styles in `.tsx`, around half of them on a `motion.*` element. The rule takes an `allow` list of CSS property names, so a project that wants it can name its own exceptions.

`no-unknown-classes` reads any class it does not recognise as misspelled Tailwind. Measured on a project with hand-written CSS, it reported `card-title`, `is-active`, `prose` and `lead`. It is right in a Tailwind-only repo and wrong everywhere else, and this package cannot tell which it is looking at.

`no-raw-colors` needs the project's theme to say what the alternative is. Without one it still fires on the raw palette, but the diagnostic loses the part that makes it worth having.

## What a consumer still has to write

Oxlint reads `settings` from the root config only and does not merge it through `extends`, the same constraint recorded for React Doctor's `portedRuleMode` in `oxlint/next.mjs`. A repo whose components resolve through a workspace alias rather than a local `components.json` therefore puts `settings.shadcn.ui` in its own config. Most consumers need nothing: the plugin discovers components and theme from `components.json`.

`componentSourceOverride(files)` carries the other half. A component may style its own internals, so the call-site rules have to stop at the component directory. Unlike the Playwright overlay, the override needs no `plugins` key: an override inherits the JS plugins named at the config root, which was measured rather than assumed.

## Alternatives rejected

Depending on the package directly was rejected for the ESLint chain above. Waiting for upstream to drop `@typescript-eslint/parser` leaves the rules out of every repo meanwhile, and the parser is a deliberate fallback for ESLint consumers rather than an oversight, so there is no reason to expect it to go.

Enabling all six rules and letting consumers switch off what they cannot take was rejected because it inverts the package's rule: a shared preset absorbs recurring failures, it does not hand every repo the same backlog to suppress.

Writing the equivalent rules into the `howells` plugin was rejected. `howells/no-raw-type-utilities` already governs the typographic slice and stays; reproducing variant discovery, theme reading and Tailwind's class grammar to reach the rest is a much larger surface than a vendored bundle.

## Cost

Upstream fixes arrive only when someone refreshes the copy, and the plugin is at 0.1.0, so it will move. `AGENTS.md` records the refresh steps. The package is also Tailwind v4 only; a consumer still on v3 gets the built-in grammar rather than its own theme.
