# The lint ratchet

`howells-ratchet` is a gate that lets each rule's finding count fall but never rise, against a committed baseline. A repo moving onto a preset, or onto a newer one, surfaces a backlog; the backlog means `pnpm lint` can't be the push gate until it's cleared, and switching the new rules off to shrink it is rule disposal. The ratchet holds the backlog instead: the gate fails only when a count rises. `pnpm lint` still reports every finding.

It replaces a hand-copied script that existed in 26 repos in diverging variants, with the same bugs fixed repo by repo.

## Commands

```
howells-ratchet                 check: measure, compare, fail on any rise
howells-ratchet --write         rebaseline from a full measurement
howells-ratchet --write --allow-rise
howells-ratchet --migrate       convert a legacy baseline and delete it
howells-ratchet --json          machine-readable output for any of the above
howells-ratchet --root <dir>    measure that repo instead of the cwd's
howells-ratchet --unformatted   opt into ratcheting unformatted-file counts
```

A check exits 0 when nothing rose, 1 when a count rose, and 2 when the gate can't be trusted - no units, a unit reaching no files, no baseline, a legacy baseline still in the repo, an unreadable report.

## What a unit is, and where its targets come from

A unit is a directory whose `lint` script runs `howells-check`. Its targets are that command's positional arguments, `!`-prefixed excludes included; a unit whose script runs only `howells-oxfmt` is format-checked and carries no counts. Candidate directories are the repo root plus whatever `pnpm-workspace.yaml` names in `packages:`; a repo with no workspace file is one unit, `.`.

Targets come from the script rather than from a walk of the tree, for two reasons.

A root-level walk of `.` in a monorepo measures something different from the per-package lint. Each package carries its own Oxlint config and its own tsconfig, and the type-aware rules judge a file by whichever project claims it, so a file no package claims is typed as `any` and rules fire on ordinary property access. Measured on one consumer tree, a `.` walk reported 505 findings against the 95 the per-package runs report. On another, 11,700 against a few hundred, most of them inside one generated module a package excludes.

And a script is what `turbo run lint` and the push gate already run, so a package that changes what it lints changes it in one place.

Each unit is measured from its own directory, so both tools resolve the nested config and the tsconfig the package's own lint run resolves.

### A root that can't name its own targets

A monorepo root whose `lint` script is a turbo fan-out plus workspace checks names no targets, yet may still have config files of its own to lint. Either give the root a `howells-check` segment naming them - the better answer, since the surface then lives with the gate that reads it - or declare them in the baseline:

```json
{ "version": 1, "targets": { ".": ["*.ts", "conformance"] }, "units": { ... } }
```

An override is a unit like any other: if it reaches no files, the gate fails.

A `lint` script that runs `howells-ratchet` itself is refused by name. That inversion is how one consumer's gate went dark: the root's targets lived in a script that was later renamed, the walk found no unit, and the gate printed a pass over nothing.

## The baseline

One file at the repo root, `lint-baseline.json`, all keys sorted:

```json
{
  "version": 1,
  "units": {
    ".": {},
    "apps/web": {
      "eslint(sort-keys)": 65,
      "react(only-export-components)": 146
    }
  }
}
```

A rule absent from a unit's map means zero. A unit whose count fell to nothing keeps its place as an empty map: dropping it would leave nothing to ratchet against.

Every diagnostic counts, whatever its severity. `pnpm lint` runs Oxlint with `--deny-warnings`, so a warning fails it; a baseline that counted only errors would be weaker than the lint it stands in for, and burning it to zero would still leave `pnpm lint` red.

A write is always a full measurement of every unit. A partial scan written as a whole baseline erases the units it didn't visit, and the gate then passes over the erased ones for good - which is how one consumer lost most of its baseline in a single rebaseline.

`--write` refuses when any count rose, and names each one. `--allow-rise` records them anyway; a repo needs it once, when a newly enabled rule is the reason. Falls and removed rules always write.

## Formatting

Formatting is mechanical, so it's a hard check rather than a ratcheted count: `howells-oxfmt --check` over each unit's targets must pass, and the gate fails if it doesn't. It isn't a second lint pass - it's the same check `howells-check` runs, kept in the gate so a repo whose `prepush` calls `lint:ratchet` rather than `lint` doesn't quietly lose it.

A repo moving onto a preset that enables a new formatter option (class sorting, say) can ratchet the count instead, with `--write --unformatted`. That adds an `unformatted` map to the baseline, and once it's there it stays. Sorting the tree is then a separate deliberate pass rather than a condition of upgrading.

## Migrating a hand-copied baseline

`--migrate` reads whichever of these it finds, writes the new file, and deletes the old:

| Legacy file | Shape | How it converts |
| --- | --- | --- |
| `scripts/lint-baseline.json` | `{unit: {rule: n}}` | structurally |
| `scripts/lint-baseline.json` | `{rule: n}`, one unit in the repo | structurally, onto that unit |
| `scripts/lint-baseline.json` | `{rule: n}`, several units | re-measured and redistributed |
| `<package>/scripts/lint-baseline.json` | `{rule: n}` | structurally, onto that package |
| `lint-ratchet.json` | `{rules: {...}, unformatted: {...}}` | structurally, opt-in kept |

A shape carrying per-unit data converts with no measurement: the numbers that arrive are the numbers that were there. A repo-wide flat map in a repo with more than one unit holds only a sum, so it can't be split; the units are measured now and the sum redistributed, and the migration is refused if any rule's repo-wide total has risen since the old file was written.

A structural migration carries the old numbers across untouched, so the first check afterwards can report a rise the old script never counted - most often because that variant counted only Oxlint's errors. The migration says how large the difference is and names the counts; read them, then run `--write --allow-rise` once.

Until the legacy file is gone, a plain check refuses to run and points at `--migrate`. Two legacy files of different shapes are refused rather than guessed at.

## Adopting it in a consumer repo

1. Upgrade `@howells/lint` to 3.5.0 or later.
2. Scripts: `"lint:ratchet": "howells-ratchet"` and `"lint:rebaseline": "howells-ratchet --write"`. Leave `lint` as the unratcheted full run, and point `prepush` at `lint:ratchet`.
3. Make sure every unit's `lint` script names its own targets. A root whose `lint` runs the old ratchet needs the real run put back.
4. `pnpm lint:ratchet --migrate`, or `pnpm lint:rebaseline` in a repo with no baseline yet.
5. Delete `scripts/lint-ratchet.mjs` / `scripts/check-lint-baseline.mjs`, and any prose about them.
6. `pnpm lint:ratchet` to confirm the gate is green, and read the unit count in its output: it should match the number of packages you expect to be linted.

Burning the backlog down is a rule at a time, rebaselining after each.
