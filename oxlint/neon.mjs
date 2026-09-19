import { createOxlintConfig } from "@howells/neon/lint";
import { defineConfig } from "oxlint";

import { boundaryJsPlugins } from "./boundaries.mjs";

// Single source of truth: the restricted-import rules live in
// @howells/neon/lint; this preset only adapts them for `extends` so the
// two copies cannot drift.
const neonConfig = createOxlintConfig();

export const neonRules = neonConfig.rules;

// `jsPlugins` carries the policy plugin so a consumer that extends only this
// preset can still name a `howells/*` rule; without it, Oxlint refuses the
// config outright with "Plugin 'howells' not found" and nothing is linted.
export default defineConfig({
  jsPlugins: boundaryJsPlugins,
  rules: neonRules,
});
