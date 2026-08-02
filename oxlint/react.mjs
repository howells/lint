import { defineConfig } from "oxlint";
import ultraciteReact from "ultracite/oxlint/react";

import core from "./core.mjs";
import { ultraciteReactDoctor } from "./ultracite-js-plugins.mjs";

// Ultracite 7.9.3 moved React Doctor into its opt-in JS-plugin preset. Keep it
// in the standard Howells React lane while leaving it out of core-only repos.
// The Next.js portion lives in the Next preset, not here.
export default defineConfig({
  extends: [core, ultraciteReact, ultraciteReactDoctor],
  rules: {
    "howells/no-generic-component-suffix": "error",
  },
});
