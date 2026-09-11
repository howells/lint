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
    // React Doctor 0.9.x rewrote its port of the react-refresh rule with a
    // stripped-down default: no framework detection, no route-file awareness.
    // Upstream restores the old behaviour through
    // `settings: { "react-doctor": { portedRuleMode: "curated" } }`, which a
    // shared preset cannot deliver — Oxlint reads `settings` from the root
    // config only and does not merge it through `extends`, so it would have to
    // land in every consumer's own `oxlint.config.ts`.
    //
    // The React lane keeps React Doctor's default, which is the real
    // react-refresh contract. A Next.js route file cannot satisfy it: it
    // exports its component *and* the segment configuration the framework reads
    // by name, so every `page.tsx` carrying metadata or a `dynamic` setting
    // reports itself as unsafe for Fast Refresh. Oxlint ships the same rule
    // natively and takes an export allowlist as a rule option, and rule options
    // — unlike `settings` — do flow through `extends`. Ultracite turns the
    // native rule off in favour of the port; this lane swaps them back.
    //
    // The names follow Next.js 16.3.4: the route segment config (`instant` and
    // `prefetch` are new in 16; `experimental_ppr` was removed), the metadata
    // exports, and the image-metadata file exports. `dynamic`, `revalidate` and
    // `fetchCache` stay for apps not yet on Cache Components.
    "react-doctor/only-export-components": "off",
    "react/only-export-components": [
      "error",
      {
        allowConstantExport: true,
        allowExportNames: [
          "alt",
          "config",
          "contentType",
          "dynamic",
          "dynamicParams",
          "fetchCache",
          "generateImageMetadata",
          "generateMetadata",
          "generateStaticParams",
          "generateViewport",
          "instant",
          "maxDuration",
          "metadata",
          "prefetch",
          "preferredRegion",
          "revalidate",
          "runtime",
          "size",
          "viewport",
        ],
      },
    ],
  },
});
