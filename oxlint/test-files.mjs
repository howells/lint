import ultraciteVitest from "ultracite/oxlint/vitest";

// What counts as a test file, everywhere in this package: Ultracite's own
// Vitest scope, plus the setup files Vitest loads before a suite. The preset's
// test-file override and `howells-fix` both read this list.
export const testFileGlobs = [
  ...ultraciteVitest.overrides[0].files,
  "**/vitest.setup.{ts,tsx,js,jsx,mts,mjs}",
  "**/test/setup.{ts,tsx,js,jsx,mts,mjs}",
];
