import { defineConfig } from "oxlint";

// The rules are vendored rather than installed: the published plugin depends on
// `@typescript-eslint/parser`, which declares ESLint as a required peer, so
// pnpm would put ESLint and a legacy TypeScript compiler in every consumer even
// though Oxlint is the only thing that ever runs these rules. `oxc-parser` is a
// direct dependency here so the plugin never reaches that fallback.
const shadcnPluginSpecifier = import.meta
  .resolve("../vendor/shadcn-lint/index.js");

export const shadcnJsPlugins = [
  { name: "shadcn", specifier: shadcnPluginSpecifier },
];

// The two rules that carry no design-system policy. They report a malformed
// class, not a disallowed one, so they need no component recognition, no theme
// and no per-project allow list — and they report nothing in a repo that does
// not use Tailwind, because the shapes they match only occur in Tailwind class
// strings.
//
// `no-arbitrary-values` rejects `p-[13px]` and names the scale value that
// matches. `require-static-classes` rejects a className the linter cannot read,
// such as `` `mt-${size}` ``; `cn("mt-2", active && "w-full")` is readable and
// passes, so the fix is the shape the codebase already uses.
//
// The `allow` entry exempts a bracket that holds one CSS variable reference and
// nothing else. `text-[var(--cs-text)]` reads a design token, so reporting it as
// an off-token value inverts the rule's own intent, and the suggested fix — use
// a theme token — is what the class already does. Upstream agrees in one of the
// two spellings: Tailwind v4's shorthand `text-(--cs-text)` is documented as a
// variable shorthand rather than an arbitrary value and passes untouched, while
// the older bracket form of the same thing errors. Measured in a repo whose
// design system is entirely `--cs-*` custom properties, this was 1,890 of 2,024
// findings.
//
// The second entry covers the same reference written with one of Tailwind's
// type hints, `text-[length:var(--cs-text-small)]`. The hint tells Tailwind how
// to read the variable; it adds no value of its own.
//
// Both patterns are anchored so that the bracket holds a variable reference and
// nothing else. A value that merely contains one still reports, because it
// still carries hardcoded parts:
// `shadow-[inset_0_0_0_1px_var(--cs-text)]`, `p-[calc(var(--gap)*2)]` and
// `border-[color:color-mix(in_oklab,var(--cs-border)_60%,transparent)]` are all
// covered. Variant and important forms of an exempt class are exempt with it.
// `layout` is allowed because the layout values repos actually write have no
// token to move to. Measured across the consumer repos, the arbitrary values
// that survive review are `max-w-[68ch]`, `grid-cols-[minmax(0,1fr)_392px]`,
// `top-[clamp(1.5rem,5vw,5rem)]` and their relatives: a reading measure, a grid
// track, a fluid offset. Tailwind has no scale for any of them, so the rule at
// error severity was unsatisfiable and blocked the upgrade rather than
// improving the design system. It is also the allowance upstream's own
// quickstart uses.
//
// Appearance keeps every check, which is where an off-token value is a real
// design-system problem: `rounded-[3px]`, `bg-[#ec4899]`, `text-[19px]` and
// `shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]` all still report, and the message
// names the scale value or theme colour to use instead.
//
// The cost is that a width with an exact scale equivalent, `w-[280px]` for
// `w-70`, now passes. A repo that wants those back drops `layout` from the
// allow list in its own config.
export const shadcnRules = {
  "shadcn/no-arbitrary-values": [
    "error",
    { allow: ["layout", "*-[var(--*)]", "*-[*:var(--*)]"] },
  ],
  "shadcn/require-static-classes": "error",
};

// The design-system rules. Every one of them needs something this package
// cannot know: which components a project owns, what its theme declares, and
// which of those a page is allowed to override. A consumer enables them in its
// own config, where that policy lives. See the README for the shapes.
//
// `no-restyle` is the reason to adopt the plugin and the reason it cannot be
// switched on from here: with no `contracts` it reports every existing
// `className` override on a recognised component at once.
export const designSystemRuleNames = [
  "shadcn/no-restyle",
  "shadcn/no-raw-colors",
  "shadcn/no-unknown-classes",
  "shadcn/no-inline-styles",
];

// A component may style its own internals, so the rules that police call sites
// have to stop at the component directory. Oxlint reads a rule entry against
// the plugins in scope at that point, and `shadcn` is a JS plugin named at the
// root — an override entry inherits it, so this needs no `plugins` key of its
// own, unlike the Playwright overlay's Vitest exemption.
//
// `no-inline-styles` is deliberately absent: it is the one design-system rule
// the plugin's own documentation says to keep enabled inside the component
// directory, because a component has no more right to a hardcoded colour than
// a page does.
export const componentSourceOverride = (files) => ({
  files,
  rules: {
    "shadcn/no-arbitrary-values": "off",
    "shadcn/no-raw-colors": "off",
    "shadcn/no-restyle": "off",
    "shadcn/no-unknown-classes": "off",
  },
});

export default defineConfig({
  jsPlugins: shadcnJsPlugins,
  rules: shadcnRules,
});
