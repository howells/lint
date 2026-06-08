import { defineConfig } from "oxlint";

const howellsPolicyPluginSpecifier = new URL("./howells-policy-plugin.mjs", import.meta.url).href;

export const boundaryJsPlugins = [{ name: "howells", specifier: howellsPolicyPluginSpecifier }];

export const boundarySettings = {};

export const boundaryRules = {
  "howells/no-cross-workspace-app-imports": "error",
};

export default defineConfig({
  jsPlugins: boundaryJsPlugins,
  rules: boundaryRules,
  settings: boundarySettings,
});
