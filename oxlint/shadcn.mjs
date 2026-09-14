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
export const shadcnRules = {
  "shadcn/no-arbitrary-values": "error",
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
