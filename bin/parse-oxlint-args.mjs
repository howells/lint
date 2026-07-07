// Oxlint flags that consume the following argument when written in space form
// (e.g. `--config oxlint.config.ts`). Without pairing, that value would be
// misread as a lint target. The `--flag=value` form never needs pairing.
const VALUE_FLAGS = new Set([
  "-c",
  "--config",
  "--tsconfig",
  "--format",
  "--ignore-path",
  "--ignore-pattern",
  "--threads",
  "-A",
  "--allow",
  "-D",
  "--deny",
  "-W",
  "--warn",
  "--max-warnings",
  "--report-unused-disable-directives-severity",
]);

// Split raw CLI args into oxlint options and lint targets, keeping any value
// that belongs to a space-form value flag attached to that flag rather than
// treating it as a target.
export const partitionOxlintArgs = (args) => {
  const options = [];
  const targets = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("-")) {
      targets.push(arg);
      continue;
    }

    options.push(arg);

    const isPairedValueFlag = VALUE_FLAGS.has(arg) && !arg.includes("=");
    const nextArg = args[index + 1];

    if (isPairedValueFlag && nextArg !== undefined) {
      options.push(nextArg);
      index += 1;
    }
  }

  return { options, targets };
};
