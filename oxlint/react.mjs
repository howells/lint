import { defineConfig } from "oxlint";
import ultraciteReact from "ultracite/oxlint/react";
import core from "./core.mjs";

// Ultracite's React preset now registers the react-doctor plugin and enables
// its full rule set, so this preset only layers the Howells-specific policy on
// top of core + Ultracite.
export default defineConfig({
  extends: [core, ultraciteReact],
  rules: {
    "howells/no-generic-component-suffix": "error",
  },
});
