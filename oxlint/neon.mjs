import { createOxlintConfig } from "@howells/neon/lint";
import { defineConfig } from "oxlint";

// Single source of truth: the restricted-import rules live in
// @howells/neon/lint; this preset only adapts them for `extends` so the
// two copies cannot drift.
const neonConfig = createOxlintConfig();

export const neonRules = neonConfig.rules;

export default defineConfig({
  rules: neonRules,
});
