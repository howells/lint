import ultraciteCore from "ultracite/oxlint/core";

// Ultracite's ignores plus generated directories. Oxlint reads `ignorePatterns`
// from the root config only, never through `extends`, so the `howells-*` bins
// pass these on the command line. A consumer that runs bare `oxlint`, or an
// editor, spreads this list into its own `ignorePatterns` instead.
export const ignorePatterns = [
  ...ultraciteCore.ignorePatterns,
  "**/generated/**",
];
