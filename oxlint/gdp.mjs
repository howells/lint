import { defineConfig } from "oxlint";
import ultraciteGdp from "ultracite/oxlint/gdp";

import { boundaryJsPlugins } from "./boundaries.mjs";

// Keep Ultracite's rules and trusted-module overrides intact. Consumers only
// install @howells/lint for lint tooling, so resolve the pinned plugin here
// rather than asking Oxlint to find it beside the consumer's config.
export default defineConfig({
  ...ultraciteGdp,
  jsPlugins: [
    ...boundaryJsPlugins,
    ...ultraciteGdp.jsPlugins.map((plugin) => ({
      ...plugin,
      specifier: import.meta.resolve(plugin.specifier),
    })),
  ],
});
