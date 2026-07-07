import { defineConfig } from "oxlint";
import ultraciteNext from "ultracite/oxlint/next";
import react from "./react.mjs";

// Ultracite's Next preset supplies the react-doctor Next.js rules; this preset
// only adds the Howells-specific page policy on top of react + Ultracite.
export default defineConfig({
  extends: [react, ultraciteNext],
  rules: {
    "howells/no-single-client-component-page": "error",
  },
});
