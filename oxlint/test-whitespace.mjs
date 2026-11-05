import { defineConfig } from "oxlint";
import ultraciteAntiSlop from "ultracite/oxlint/anti-slop";

// The only fixes `howells-fix` applies to test files. Every rule here fixes
// whitespace alone, which cannot change what an assertion asserts - the same
// reason oxfmt is allowed to format test files. Everything else stays
// report-only in tests.
export default defineConfig({
  categories: { correctness: "off" },
  jsPlugins: ultraciteAntiSlop.jsPlugins,
  plugins: [],
  rules: {
    "anti-slop/require-readable-spacing": "error",
  },
});
