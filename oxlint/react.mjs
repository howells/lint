import { defineConfig } from "oxlint";
import ultraciteReact from "ultracite/oxlint/react";

import core from "./core.mjs";
import shadcn from "./shadcn.mjs";
import { ultraciteReactDoctor } from "./ultracite-js-plugins.mjs";

// Ultracite 7.9.3 moved React Doctor into its opt-in JS-plugin preset. Keep it
// in the standard Howells React lane while leaving it out of core-only repos.
// The Next.js portion lives in the Next preset, not here.
//
// The shadcn preset carries the vendored `@shadcn/lint` plugin and the two of
// its rules that need no project configuration. It is extended here rather than
// in core because every rule it loads reads JSX. A consumer adds the
// design-system rules itself; see `./shadcn.mjs`.
export default defineConfig({
  extends: [core, ultraciteReact, ultraciteReactDoctor, shadcn],
  rules: {
    "howells/no-generic-component-suffix": "error",
  },
});
