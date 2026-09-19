import { writeSync } from "node:fs";

// Flags that tell a tool to read the source from stdin and write the result to
// stdout instead of touching a file. Oxfmt has one (`--stdin-filepath`, in both
// `=value` and space form); Oxlint 1.82.0 has none.
//
// These matter here because every wrapper otherwise runs its tool through
// `spawnPackageBinCapture`, which captures stdio and so hands the child no
// stdin. A consumer piping source in got an empty string and exit 0 back.
export const OXFMT_STDIN_FLAGS = ["--stdin-filepath"];

export const hasStdinFlag = (args, flags = OXFMT_STDIN_FLAGS) =>
  args.some((arg) =>
    flags.some((flag) => arg === flag || arg.startsWith(`${flag}=`))
  );

// A wrapper stage that needs a path on disk - Oxlint, or the two-tool check and
// fix commands - cannot serve a stdin request. Say so and fail rather than
// returning an empty formatted source, which reads as success.
// Written with `writeSync` because the caller exits immediately afterwards, and
// a write to a pipe is otherwise asynchronous - the same truncation documented
// in `empty-target-set.mjs`.
export const refuseStdin = (commandName) => {
  writeSync(
    2,
    `${commandName}: reading source from stdin is not supported — pass file paths, or use howells-oxfmt --stdin-filepath for a single file.\n`
  );
};
