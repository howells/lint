import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";

import core from "./core.mjs";

const playwrightPluginSpecifier = import.meta
  .resolve("eslint-plugin-playwright");
const { "no-empty-pattern": _noEmptyPattern, ...recommendedPlaywrightRules } =
  playwright.configs["flat/recommended"].rules;

export const playwrightJsPlugins = [
  { name: "playwright", specifier: playwrightPluginSpecifier },
];

export const playwrightRules = {
  ...recommendedPlaywrightRules,
  "playwright/no-element-handle": "error",
  "playwright/no-force-option": "error",
  "playwright/no-wait-for-timeout": "error",
  "playwright/prefer-web-first-assertions": "error",
};

export default defineConfig({
  extends: [core],
  jsPlugins: playwrightJsPlugins,
  rules: playwrightRules,
});
