import { defineConfig } from "oxlint";
import ultraciteJsPlugins from "ultracite/oxlint/js-plugins";
import ultraciteNextJsPlugins from "ultracite/oxlint/next/js-plugins";
import ultraciteTanstackJsPlugins from "ultracite/oxlint/tanstack/js-plugins";

// Consumers install only `@howells/lint`, so Ultracite's bare plugin specifiers
// would not resolve from their config. Resolve each one here instead.
const pluginsNamed = (preset, ...names) =>
  (preset.jsPlugins ?? [])
    .filter((plugin) => names.includes(plugin.name))
    .map((plugin) => ({
      ...plugin,
      specifier: import.meta.resolve(plugin.specifier),
    }));
const rulesNamed = (preset, matches) =>
  Object.fromEntries(
    Object.entries(preset.rules ?? {}).filter(([ruleName]) => matches(ruleName))
  );
const prefixed = (prefix) => (ruleName) => ruleName.startsWith(prefix);

export const ultraciteCoreJsPlugins = defineConfig({
  jsPlugins: pluginsNamed(ultraciteJsPlugins, "github", "sonarjs"),
  overrides: ultraciteJsPlugins.overrides,
  rules: {
    ...rulesNamed(ultraciteJsPlugins, prefixed("github/")),
    ...rulesNamed(ultraciteJsPlugins, prefixed("sonarjs/")),
  },
});

// Ultracite 7.10.0 split React Doctor's framework rules out of the base
// JS-plugin preset because several of them fire on generic JSX and recommend a
// framework's replacement. Its TanStack export mixes two kinds: the `query-*`
// rules only match TanStack Query's own API (`useQuery`, `useMutation`,
// `QueryClient`), so they cannot fire in a repo that does not call it and stay
// in the standard React lane; the `tanstack-start-*` rules assume TanStack
// Start's router and are dropped, since this lane targets Next.js.
export const ultraciteReactDoctor = defineConfig({
  jsPlugins: pluginsNamed(ultraciteJsPlugins, "react-doctor"),
  rules: {
    ...rulesNamed(ultraciteJsPlugins, prefixed("react-doctor/")),
    ...rulesNamed(ultraciteTanstackJsPlugins, prefixed("react-doctor/query-")),
  },
});

// The `react-doctor/nextjs-*` rules, which 7.10.0 moved into their own opt-in
// preset. They belong to the Next preset alone: outside Next.js they reject
// plain `<img>`, `<a>`, and `<script>` in favor of imports that do not exist.
export const ultraciteNextReactDoctor = defineConfig({
  jsPlugins: pluginsNamed(ultraciteNextJsPlugins, "react-doctor"),
  rules: rulesNamed(ultraciteNextJsPlugins, prefixed("react-doctor/")),
});
