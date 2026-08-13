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
    // sonarjs/function-name defaults to `^[_a-z][a-zA-Z0-9]*$`, which rejects
    // every PascalCase name — so in a React lane it fires on components, the one
    // place the ecosystem *requires* that case. JSX resolves a lowercase tag to
    // an intrinsic element, so `function widget()` is not a rename of
    // `function Widget()`; it is a different program.
    //
    // Left as shipped, this preset contradicted itself: the Next lane
    // deliberately re-allows `export default function Page()` below, and then
    // this rule rejected the name `Page`. It also rejected every Next.js route
    // handler export — `GET`, `POST`, `PATCH`, `DELETE` — which the framework
    // dispatches on by name and which therefore cannot be renamed at all. On one
    // consumer app that was 70 unfixable errors: 55 route handlers and 15
    // components.
    //
    // Widened to camelCase OR PascalCase, which is the naming rule React and
    // Next actually impose. Note sonarjs itself ships this rule *disabled* in
    // its recommended config; Ultracite enables it. `core` keeps the strict
    // camelCase default, so Node and non-React packages are unaffected.
    "sonarjs/function-name": [
      "error",
      { format: "^([_a-z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*)$" },
    ],
  },
});
