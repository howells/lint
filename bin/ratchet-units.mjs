import { existsSync, globSync, readFileSync } from "node:fs";
import path from "node:path";

import { partitionOxlintArgs } from "./parse-oxlint-args.mjs";

// The binaries whose arguments name a lint surface. `howells-check` runs the
// linter and the formatter, so its unit carries finding counts; a package on
// `howells-oxfmt` alone has nothing to count and is format-checked only.
const CHECK_BIN = "howells-check";
const FORMAT_BIN = "howells-oxfmt";

// Split a script body into arguments the way a shell would, honouring the
// quotes a consumer needs around an exclude: `howells-check src '!**/*.gen.ts'`
// is three arguments, and the quotes are not part of the third. Without this the
// quote characters travel into the pattern and the exclude silently stops
// matching, so the measured surface is wider than the linted one.
export const splitScriptArgs = (script) => {
  const args = [];
  let current = "";
  let started = false;
  let quote;

  for (const character of script) {
    if (quote) {
      if (character === quote) {
        quote = undefined;
      } else {
        current += character;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      started = true;
      continue;
    }

    if (/\s/u.test(character)) {
      if (started) {
        args.push(current);
        current = "";
        started = false;
      }
      continue;
    }

    current += character;
    started = true;
  }

  if (started) {
    args.push(current);
  }

  return args;
};

// The `packages:` list from pnpm-workspace.yaml, read without a YAML parser:
// this package ships no runtime dependency for one, and the list is always a
// flat sequence of quoted or bare globs. Any other top-level key ends it.
export const workspaceGlobs = (root) => {
  const manifestPath = path.join(root, "pnpm-workspace.yaml");

  if (!existsSync(manifestPath)) {
    return [];
  }

  const globs = [];
  let inPackages = false;

  for (const rawLine of readFileSync(manifestPath, "utf-8").split("\n")) {
    const line = rawLine.replace(/#.*$/u, "");

    if (/^packages\s*:/u.test(line)) {
      inPackages = true;
      continue;
    }

    if (!inPackages) {
      continue;
    }

    const entry = /^\s+-\s*(.+?)\s*$/u.exec(line);

    if (entry) {
      globs.push(entry[1].replace(/^["']|["']$/gu, ""));
      continue;
    }

    if (line.trim() !== "") {
      break;
    }
  }

  return globs;
};

// The directories a workspace's globs resolve to, plus the repo root, which is a
// candidate unit in every repo: a single-package repo is nothing but its root,
// and a monorepo root often lints config files of its own.
export const unitDirectories = (root) => {
  const negations = [];
  const positives = [];

  for (const glob of workspaceGlobs(root)) {
    if (glob.startsWith("!")) {
      negations.push(glob.slice(1));
    } else {
      positives.push(glob);
    }
  }

  const excluded = new Set(
    negations.flatMap((glob) => globSync(glob, { cwd: root }))
  );

  const relativeDirs = positives
    .flatMap((glob) => globSync(glob, { cwd: root }))
    .filter((relative) => !excluded.has(relative))
    .map((relative) => relative.split(path.sep).join("/"))
    .sort();

  return [".", ...new Set(relativeDirs)];
};

// The lint surface one directory declares, read from its own `lint` script. The
// script is the only honest source: it is what `turbo run lint` and the push
// gate already run, and a package that changes what it lints changes it there.
//
// A root-level walk of `.` is not the same measurement. Each package carries its
// own oxlint config and its own tsconfig, and the type-aware rules judge a file
// by whichever project claims it, so a file no package claims is typed as `any`
// and the rules fire on ordinary property access. Measured on one consumer tree,
// a `.` walk reported 505 findings against the 95 the per-package runs report.
export const unitFrom = (root, relativeDir) => {
  const dir = path.join(root, relativeDir);
  const manifestPath = path.join(dir, "package.json");

  if (!existsSync(manifestPath)) {
    return undefined;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const script = manifest.scripts?.lint;

  if (typeof script !== "string") {
    return undefined;
  }

  const segments = script
    .split("&&")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const [binary, ...rest] = splitScriptArgs(segment);

    // A `lint` script that runs this gate names no targets, so deriving the
    // surface from it would measure nothing and pass over nothing. That is how
    // one consumer's root unit went dark: its targets lived in a script name
    // that was later renamed, the walk found no unit, and the gate printed a
    // pass. Say so instead.
    if (binary === "howells-ratchet") {
      return {
        name: relativeDir,
        dir,
        error:
          "its `lint` script runs howells-ratchet, so it names no lint targets. Put the real run back in `lint` (howells-check <targets>) and keep the gate in `lint:ratchet`.",
      };
    }

    if (binary !== CHECK_BIN && binary !== FORMAT_BIN) {
      continue;
    }

    const { options, targets } = partitionOxlintArgs(rest);

    return {
      name: relativeDir,
      dir,
      counted: binary === CHECK_BIN,
      options: options.filter(
        (option) => option !== "--check" && option !== "--write"
      ),
      targets: targets.length > 0 ? targets : ["."],
    };
  }

  return undefined;
};

// Every unit in the repo, in a stable order. `targetOverrides` supplies the
// surface for a unit whose `lint` script cannot name one — a monorepo root
// whose `lint` is a turbo fan-out plus workspace checks, say, which still has
// config files of its own to lint. An override is a lint unit like any other,
// including the rule that a unit measuring zero files is a failure.
export const discoverUnits = (root, targetOverrides = {}) => {
  const units = [];
  const errors = [];
  const seen = new Set();

  for (const relativeDir of unitDirectories(root)) {
    const unit = unitFrom(root, relativeDir);

    if (unit?.error) {
      errors.push(`${unit.name}: ${unit.error}`);
      continue;
    }

    if (unit) {
      units.push(unit);
      seen.add(relativeDir);
    }
  }

  for (const [name, targets] of Object.entries(targetOverrides).sort(
    ([left], [right]) => left.localeCompare(right)
  )) {
    if (seen.has(name)) {
      continue;
    }

    const dir = path.join(root, name);

    if (!existsSync(path.join(dir, "package.json"))) {
      errors.push(
        `${name}: named in the baseline's "targets" but there is no package.json there.`
      );
      continue;
    }

    units.push({
      name,
      dir,
      counted: true,
      options: [],
      targets: targets.length > 0 ? targets : ["."],
    });
  }

  units.sort((left, right) => left.name.localeCompare(right.name));

  return { units, errors };
};
