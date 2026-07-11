import { defineConfig } from "oxlint";
import ultraciteJsPlugins from "ultracite/oxlint/js-plugins";

const pluginsNamed = (...names) =>
  (ultraciteJsPlugins.jsPlugins ?? [])
    .filter((plugin) => names.includes(plugin.name))
    .map((plugin) => ({
      ...plugin,
      specifier: import.meta.resolve(plugin.specifier),
    }));
const rulesWithPrefix = (prefix) =>
  Object.fromEntries(
    Object.entries(ultraciteJsPlugins.rules ?? {}).filter(([ruleName]) =>
      ruleName.startsWith(prefix)
    )
  );

export const ultraciteCoreJsPlugins = defineConfig({
  jsPlugins: pluginsNamed("github", "sonarjs"),
  overrides: ultraciteJsPlugins.overrides,
  rules: {
    ...rulesWithPrefix("github/"),
    ...rulesWithPrefix("sonarjs/"),
  },
});

export const ultraciteReactDoctor = defineConfig({
  jsPlugins: pluginsNamed("react-doctor"),
  rules: rulesWithPrefix("react-doctor/"),
});
