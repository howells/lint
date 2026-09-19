#!/usr/bin/env node
//
// The lint ratchet: a committed count of Oxlint findings per unit per rule that
// may fall but never rise.
//
// Turning a preset on surfaces a backlog, and a backlog means `pnpm lint` cannot
// be the push gate until it is cleared. Switching the rules off to shrink the
// backlog is rule disposal, so the backlog is held in `lint-baseline.json`
// instead: this gate fails only when a count rises. `pnpm lint` still reports
// every finding; this only decides the gate.
//
// Each unit is measured from its own directory with its own targets, read from
// its own `lint` script — the surface `turbo run lint` already covers. See
// `ratchet-units.mjs` for why a root-level walk is a different measurement.

import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  baselinePathFor,
  compare,
  findLegacyBaselines,
  measurementsToUnformatted,
  measurementsToUnits,
  readBaseline,
  removeLegacyBaseline,
  sumCounts,
  totalFindings,
  writeBaseline,
} from "./ratchet-baseline.mjs";
import { measureRepo } from "./ratchet-measure.mjs";
import { discoverUnits } from "./ratchet-units.mjs";

const FLAGS = new Set([
  "--write",
  "--allow-rise",
  "--migrate",
  "--json",
  "--unformatted",
]);

const args = process.argv.slice(2);
const flags = new Set();
let rootArg;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--root") {
    rootArg = args[index + 1];
    index += 1;
    continue;
  }

  if (arg.startsWith("--root=")) {
    rootArg = arg.slice("--root=".length);
    continue;
  }

  if (!FLAGS.has(arg)) {
    console.error(
      `howells-ratchet: unknown argument ${arg}. Usage: howells-ratchet [--write] [--allow-rise] [--migrate] [--unformatted] [--json] [--root <dir>]`
    );
    process.exit(2);
  }

  flags.add(arg);
}

// A workspace root is where pnpm-workspace.yaml is, so the gate can be run from
// a package directory and still measure the whole repo against the one baseline.
const findRoot = (from) => {
  let directory = path.resolve(from);

  for (;;) {
    if (existsSync(path.join(directory, "pnpm-workspace.yaml"))) {
      return directory;
    }

    const parent = path.dirname(directory);

    if (parent === directory) {
      return path.resolve(from);
    }

    directory = parent;
  }
};

const root = rootArg ? path.resolve(rootArg) : findRoot(process.cwd());
const write = flags.has("--write");
const allowRise = flags.has("--allow-rise");
const asJson = flags.has("--json");

const emitJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

const fail = (message, { code = 2, payload } = {}) => {
  if (asJson) {
    emitJson({ ok: false, ...payload, error: message });
  } else {
    process.stderr.write(`howells-ratchet: ${message}\n`);
  }

  process.exit(code);
};

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const riseLine = ({ unit, rule, now, was }) =>
  `${unit}  ${rule}  ${now} > ${was}`;

const fallLine = ({ unit, rule, now, was }) =>
  `${unit}  ${rule}  ${was} -> ${now}`;

// ---------------------------------------------------------------- measurement

const existingBaseline = (() => {
  try {
    return readBaseline(root);
  } catch (error) {
    if (flags.has("--migrate")) {
      return undefined;
    }

    fail(error.message);
  }
})();

const legacy = findLegacyBaselines(root);

if (!(flags.has("--migrate") || existingBaseline) && legacy.length > 0) {
  fail(
    `no ${path.basename(baselinePathFor(root))}, but a hand-copied baseline is still here:\n  ${legacy
      .map(({ file }) => path.relative(root, file))
      .join("\n  ")}\nRun \`howells-ratchet --migrate\` to convert it.`
  );
}

const { units, errors } = discoverUnits(root, existingBaseline?.targets ?? {});

if (errors.length > 0) {
  fail(`the gate cannot be trusted:\n  ${errors.join("\n  ")}`);
}

// Finding no unit is the disarmed gate: a variant read one unit's targets from a
// script name that had been renamed, found nothing, and printed a pass over
// nothing. Nothing to measure is never a pass.
if (units.length === 0) {
  fail(
    `found no lint units under ${root}. A unit is a directory whose \`lint\` script runs howells-check; a monorepo root that lints files of its own but whose \`lint\` script cannot name them declares them in the baseline's "targets".`
  );
}

// A repo ratchets its unformatted-file counts only when it has said so: by
// carrying an `unformatted` map already, by asking for one on a write, or by
// migrating a legacy baseline that carried one. Everywhere else formatting is a
// hard check.
const ratchetUnformatted =
  flags.has("--unformatted") ||
  existingBaseline?.unformatted !== undefined ||
  legacy.some(({ shape }) => shape.unformatted !== undefined);

const { measurements, failures } = measureRepo(units, { ratchetUnformatted });

if (failures.length > 0) {
  fail(`the gate cannot be trusted:\n  ${failures.join("\n  ")}`, {
    payload: { units: units.length },
  });
}

const current = {
  units: measurementsToUnits(measurements),
  unformatted: ratchetUnformatted
    ? measurementsToUnformatted(measurements)
    : undefined,
};
const total = totalFindings(current.units);
const countedUnits = Object.keys(current.units).length;

// -------------------------------------------------------------------- migrate

if (flags.has("--migrate")) {
  if (legacy.length === 0) {
    fail(
      `no legacy baseline to migrate. Looked for scripts/lint-baseline.json, lint-ratchet.json, and */scripts/lint-baseline.json under ${root}.`
    );
  }

  const kinds = new Set(legacy.map(({ shape }) => shape.kind));

  if (kinds.size > 1) {
    fail(
      `these legacy baselines disagree about their shape, so migrating them together would guess:\n  ${legacy
        .map(
          ({ file, shape }) => `${path.relative(root, file)} (${shape.kind})`
        )
        .join("\n  ")}\nConvert them by hand into one ${path.basename(
        baselinePathFor(root)
      )}.`
    );
  }

  const migratedUnits = {};
  let migratedUnformatted;

  for (const { shape } of legacy) {
    if (shape.kind === "per-unit") {
      for (const [name, counts] of Object.entries(shape.units)) {
        migratedUnits[name] = { ...migratedUnits[name], ...counts };
      }

      if (shape.unformatted) {
        migratedUnformatted = {
          ...migratedUnformatted,
          ...shape.unformatted,
        };
      }

      continue;
    }

    // A repo-wide flat map holds a sum with no unit in it. One unit takes it
    // whole; more than one has to be re-measured and redistributed, which is
    // safe only while no rule's repo-wide total has risen.
    if (countedUnits === 1) {
      const [only] = Object.keys(current.units);
      migratedUnits[only] = { ...migratedUnits[only], ...shape.counts };
      continue;
    }

    const repoWide = {};

    for (const counts of Object.values(current.units)) {
      for (const [rule, count] of Object.entries(counts)) {
        repoWide[rule] = (repoWide[rule] ?? 0) + count;
      }
    }

    const risenRules = Object.entries(repoWide)
      .filter(([rule, count]) => count > (shape.counts[rule] ?? 0))
      .map(([rule, count]) => `${rule}  ${count} > ${shape.counts[rule] ?? 0}`);

    if (risenRules.length > 0 && !allowRise) {
      fail(
        `this repo's legacy baseline is one repo-wide sum across ${plural(countedUnits, "unit")}, so migrating it means measuring each unit now — and these rules have risen since it was written:\n  ${risenRules.join(
          "\n  "
        )}\nFix them first, or pass --allow-rise to record today's counts.`,
        { code: 1 }
      );
    }

    Object.assign(migratedUnits, current.units);
  }

  const written = writeBaseline(root, {
    units: migratedUnits,
    unformatted: migratedUnformatted,
    targets: existingBaseline?.targets,
  });

  for (const { file } of legacy) {
    removeLegacyBaseline(file);
  }

  const migratedTotal = totalFindings(written.units);

  // A structural migration carries the old numbers across untouched, so the
  // first check afterwards can report a rise the old script never counted. The
  // commonest cause is a variant that counted only Oxlint's errors: this gate
  // counts every diagnostic, because `pnpm lint` runs with --deny-warnings and a
  // warning fails it, so a baseline that omits warnings is weaker than the lint
  // it stands in for. Say what the difference is, rather than absorbing it.
  const { risen: risenAfter } = compare(current, written);

  if (asJson) {
    emitJson({
      ok: true,
      migrated: legacy.map(({ file }) => path.relative(root, file)),
      units: Object.keys(written.units).length,
      total: migratedTotal,
      measured: total,
      risen: risenAfter,
    });
  } else {
    process.stdout.write(
      `howells-ratchet: migrated ${plural(legacy.length, "legacy baseline")} into ${path.basename(
        baselinePathFor(root)
      )} — ${migratedTotal} findings across ${plural(Object.keys(written.units).length, "unit")}. Deleted:\n  ${legacy
        .map(({ file }) => path.relative(root, file))
        .join("\n  ")}\n`
    );

    if (risenAfter.length > 0) {
      process.stdout.write(
        `\n${plural(
          risenAfter.length,
          "count"
        )} measure higher than the migrated numbers (${total} against ${migratedTotal}), so the check will fail until they are recorded. Read them, then run \`howells-ratchet --write --allow-rise\` once:\n  ${risenAfter
          .slice(0, 20)
          .map(riseLine)
          .join("\n  ")}${
          risenAfter.length > 20
            ? `\n  … and ${risenAfter.length - 20} more`
            : ""
        }\n`
      );
    }
  }

  process.exit(0);
}

// ---------------------------------------------------------------------- write

if (write) {
  // A rebaseline that quietly raises a count is the gate resetting itself. It
  // takes an explicit --allow-rise, which a repo needs once when a new rule is
  // first enabled. Falls and removed rules always write.
  if (existingBaseline && !allowRise) {
    const { risen } = compare(current, existingBaseline);

    if (risen.length > 0) {
      fail(
        `${plural(risen.length, "count")} rose, so this would raise the baseline:\n  ${risen
          .map(riseLine)
          .join(
            "\n  "
          )}\nFix them, or pass --allow-rise when a newly enabled rule is the reason.`,
        { code: 1, payload: { risen } }
      );
    }
  }

  const written = writeBaseline(root, {
    units: current.units,
    unformatted: current.unformatted,
    targets: existingBaseline?.targets,
  });

  if (asJson) {
    emitJson({
      ok: true,
      wrote: path.basename(baselinePathFor(root)),
      units: countedUnits,
      total,
      unformatted: written.unformatted
        ? sumCounts(written.unformatted)
        : undefined,
    });
  } else {
    process.stdout.write(
      `howells-ratchet: baseline written — ${total} findings across ${plural(countedUnits, "unit")}${
        written.unformatted
          ? `, ${sumCounts(written.unformatted)} unformatted files`
          : ""
      }.\n`
    );
  }

  process.exit(0);
}

// ---------------------------------------------------------------------- check

if (!existingBaseline) {
  fail(
    `no ${path.basename(
      baselinePathFor(root)
    )}. Run \`howells-ratchet --write\` once and commit it.`
  );
}

const { risen, fallen } = compare(current, existingBaseline);
const baselineTotal = totalFindings(existingBaseline.units);

if (asJson) {
  emitJson({
    ok: risen.length === 0,
    units: countedUnits,
    total,
    baselineTotal,
    risen,
    fallen,
  });

  process.exit(risen.length === 0 ? 0 : 1);
}

if (risen.length > 0) {
  process.stderr.write(
    `howells-ratchet: ${plural(risen.length, "count")} rose:\n  ${risen
      .map(riseLine)
      .join(
        "\n  "
      )}\n${total} findings across ${plural(countedUnits, "unit")} (baseline ${baselineTotal}). Fix the new findings; never raise the baseline to accommodate them.\n`
  );
  process.exit(1);
}

process.stdout.write(
  `ratchet ok: ${total} findings across ${plural(countedUnits, "unit")} (baseline ${baselineTotal})\n`
);

if (fallen.length > 0) {
  process.stdout.write(
    `${plural(fallen.length, "count")} fell — run \`pnpm lint:rebaseline\` to lock the gain in:\n  ${fallen
      .map(fallLine)
      .join("\n  ")}\n`
  );
}
