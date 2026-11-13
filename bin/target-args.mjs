import { statSync } from "node:fs";

// The config the caller named, in either the space or the `=` form. Oxlint and
// Oxfmt spell the flag the same way.
export const explicitConfigPath = (args) => {
  for (const [index, arg] of args.entries()) {
    if (arg === "--config" || arg === "-c") {
      return args[index + 1];
    }
    if (arg.startsWith("--config=") || arg.startsWith("-c=")) {
      return arg.slice(arg.indexOf("=") + 1);
    }
  }
  return undefined;
};

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
