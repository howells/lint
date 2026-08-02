import { defineConfig } from "oxlint";
import ultraciteNext from "ultracite/oxlint/next";

import react from "./react.mjs";
import { ultraciteNextReactDoctor } from "./ultracite-js-plugins.mjs";

// React Doctor's Next.js rules reach this preset through Ultracite's opt-in
// Next JS-plugin preset; everything else comes from react + Ultracite's Next
// preset. This preset only adds the Howells-specific page policy on top.
export default defineConfig({
  extends: [react, ultraciteNext, ultraciteNextReactDoctor],
  rules: {
    "howells/no-single-client-component-page": "error",
    // Ultracite 7.10.0 requires named components to be arrow functions. Next.js
    // mandates a default export for every page, layout, and error boundary, and
    // its own generators write that export as `export default function Page()`,
    // which the arrow-only form rejects. Allowing the declaration form back is
    // narrower than it looks: core's `func-style` still rejects named function
    // declarations that are not default exports, so this frees the shape the
    // framework requires and nothing else.
    "react/function-component-definition": [
      "error",
      {
        namedComponents: ["arrow-function", "function-declaration"],
      },
    ],
  },
});
