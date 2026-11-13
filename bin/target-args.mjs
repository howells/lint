import { statSync } from "node:fs";

// Whether the caller named a config, in either the space or the `=` form.
// Oxlint and Oxfmt spell the flag the same way.
export const hasExplicitConfig = (args) =>
  args.some(
    (arg) =>
      arg === "--config" ||
      arg === "-c" ||
      arg.startsWith("--config=") ||
      arg.startsWith("-c=")
  );

// A target that does not exist is not a directory; the tool it is handed to
// reports the missing path.
export const isDirectory = (target) =>
  statSync(target, { throwIfNoEntry: false })?.isDirectory() === true;
