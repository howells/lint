// Oxlint flags that consume the following argument when written in space form
// (e.g. `--config oxlint.config.ts`). Without pairing, that value would be
// misread as a lint target. The `--flag=value` form never needs pairing.
const VALUE_FLAGS = new Set([
  "-c",
  "--config",
  "--tsconfig",
  "-f",
  "--format",
  "--ignore-path",
  "--ignore-pattern",
  "--stdin-filepath",
  "--threads",
  "--debug",
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

// A positional argument that is a pattern rather than a literal path: an
// exclude (`!**/fixtures/*.js`) or a glob (`src/**/*.ts`). Both tools document
// these, and neither can exist on disk, so nothing may check them with
// `existsSync`.
const GLOB_METACHARACTER_PATTERN = /[*?[\]{}]/u;

export const isPatternTarget = (target) =>
  target.startsWith("!") || GLOB_METACHARACTER_PATTERN.test(target);

// Oxfmt honours a `!pattern` positional natively. Oxlint does not: measured on
// 1.82.0, it neither errors nor excludes - it lints the file anyway - so the
// same argument would mean two different things across the two stages of one
// command. These translate an exclude into the flag Oxlint does honour, so a
// consumer writes the exclude once and both tools obey it.
export const oxlintExcludeArgs = (targets) =>
  targets
    .filter((target) => target.startsWith("!"))
    .flatMap((target) => ["--ignore-pattern", target.slice(1)]);

export const pathTargets = (targets) =>
  targets.filter((target) => !target.startsWith("!"));

// The same translation over a raw argument list, for the binaries that forward
// their arguments to Oxlint untouched. The flag pairing is the partition's, so a
// value that follows a space-form flag is never mistaken for a target.
export const withOxlintExcludes = (args) => {
  const translated = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("-")) {
      if (arg.startsWith("!")) {
        translated.push("--ignore-pattern", arg.slice(1));
      } else {
        translated.push(arg);
      }
      continue;
    }

    translated.push(arg);

    if (VALUE_FLAGS.has(arg) && !arg.includes("=")) {
      const nextArg = args[index + 1];
      if (nextArg !== undefined) {
        translated.push(nextArg);
        index += 1;
      }
    }
  }

  return translated;
};
