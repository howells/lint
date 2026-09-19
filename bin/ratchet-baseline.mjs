import {
  existsSync,
  globSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const BASELINE_FILE = "lint-baseline.json";
export const BASELINE_VERSION = 1;

export const baselinePathFor = (root) => path.join(root, BASELINE_FILE);

const sortKeys = (record) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right))
  );

const isCountMap = (value) =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((count) => typeof count === "number");

export const sumCounts = (record) =>
  Object.values(record ?? {}).reduce((total, count) => total + count, 0);

export const totalFindings = (units) =>
  Object.values(units ?? {}).reduce(
    (total, counts) => total + sumCounts(counts),
    0
  );

export const readBaseline = (root) => {
  const file = baselinePathFor(root);

  if (!existsSync(file)) {
    return undefined;
  }

  const parsed = JSON.parse(readFileSync(file, "utf-8"));

  if (parsed.version !== BASELINE_VERSION || typeof parsed.units !== "object") {
    throw new Error(
      `${BASELINE_FILE} is not a version ${BASELINE_VERSION} baseline. Run \`howells-ratchet --migrate\` to convert it.`
    );
  }

  return parsed;
};

// A baseline is written whole, from a whole measurement, and never merged into
// what is already there: a partial scan that rewrites the file erases every unit
// it did not visit, and the gate then passes over the erased ones for good.
export const writeBaseline = (root, { units, unformatted, targets }) => {
  const baseline = { version: BASELINE_VERSION };

  if (targets && Object.keys(targets).length > 0) {
    baseline.targets = sortKeys(targets);
  }

  baseline.units = Object.fromEntries(
    Object.entries(units)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, counts]) => [name, sortKeys(counts)])
  );

  if (unformatted) {
    baseline.unformatted = sortKeys(unformatted);
  }

  writeFileSync(
    baselinePathFor(root),
    `${JSON.stringify(baseline, null, 2)}\n`
  );

  return baseline;
};

export const measurementsToUnits = (measurements) =>
  Object.fromEntries(
    measurements
      .filter((measurement) => measurement.counts !== undefined)
      .map((measurement) => [measurement.unit.name, measurement.counts])
  );

export const measurementsToUnformatted = (measurements) =>
  Object.fromEntries(
    measurements.map((measurement) => [
      measurement.unit.name,
      measurement.unformatted,
    ])
  );

// Every count is compared against its baseline, and a rule absent from a unit's
// map means zero. A rise is a failure; a fall is the point of the gate, and is
// reported so the drop can be locked in.
export const compare = (current, baseline) => {
  const risen = [];
  const fallen = [];

  for (const [name, counts] of Object.entries(current.units)) {
    const before = baseline.units?.[name] ?? {};

    for (const [rule, count] of Object.entries(counts)) {
      const was = before[rule] ?? 0;

      if (count > was) {
        risen.push({ unit: name, rule, now: count, was });
      } else if (count < was) {
        fallen.push({ unit: name, rule, now: count, was });
      }
    }

    for (const [rule, was] of Object.entries(before)) {
      if (counts[rule] === undefined) {
        fallen.push({ unit: name, rule, now: 0, was });
      }
    }
  }

  if (current.unformatted && baseline.unformatted) {
    for (const [name, count] of Object.entries(current.unformatted)) {
      const was = baseline.unformatted[name] ?? 0;

      if (count > was) {
        risen.push({ unit: name, rule: "unformatted files", now: count, was });
      } else if (count < was) {
        fallen.push({ unit: name, rule: "unformatted files", now: count, was });
      }
    }
  }

  // Sorted, so the same rise always prints in the same order and a diff of two
  // runs is about the counts rather than about iteration order.
  const byUnitThenRule = (left, right) =>
    left.unit.localeCompare(right.unit) || left.rule.localeCompare(right.rule);

  return {
    risen: risen.sort(byUnitThenRule),
    fallen: fallen.sort(byUnitThenRule),
  };
};

// The three shapes this gate replaces, each a hand-copied script's own file:
//
//   scripts/lint-baseline.json     `{unit: {rule: n}}` or a repo-wide `{rule: n}`
//   packages/*/scripts/...         one flat `{rule: n}` per package
//   lint-ratchet.json              `{rules: {unit: {rule: n}}, unformatted: {...}}`
//
// A shape carrying per-unit data converts structurally, with no measurement: the
// numbers that arrive are the numbers that were there. A repo-wide flat map in a
// repo with more than one unit carries only a sum, so it cannot be split; the
// caller measures and redistributes, and the migration is refused if any rule's
// repo-wide total rose in the process.
export const findLegacyBaselines = (root) => {
  const nested = globSync(
    ["*/scripts/lint-baseline.json", "*/*/scripts/lint-baseline.json"],
    { cwd: root, exclude: (name) => name === "node_modules" }
  ).map((relative) => path.join(root, relative));

  const candidates = new Set([
    path.join(root, "scripts", BASELINE_FILE),
    path.join(root, "lint-ratchet.json"),
    ...nested,
  ]);

  const found = [];

  for (const file of candidates) {
    if (
      !existsSync(file) ||
      path.resolve(file) === path.resolve(baselinePathFor(root))
    ) {
      continue;
    }

    found.push({ file, shape: legacyShape(file, root) });
  }

  return found.sort((left, right) => left.file.localeCompare(right.file));
};

const legacyShape = (file, root) => {
  const parsed = JSON.parse(readFileSync(file, "utf-8"));
  const relative = path.relative(root, file).split(path.sep).join("/");
  const values = Object.values(parsed);

  if (typeof parsed.rules === "object" && parsed.rules !== null) {
    return {
      kind: "per-unit",
      units: parsed.rules,
      unformatted: isCountMap(parsed.unformatted)
        ? parsed.unformatted
        : undefined,
    };
  }

  if (values.length > 0 && values.every((value) => typeof value === "number")) {
    // A flat `{rule: n}` map. Where it sits inside a package it is that package's
    // own counts; at the repo root it is a repo-wide sum with no unit in it.
    const owner = /^(.+)\/scripts\/lint-baseline\.json$/u.exec(relative)?.[1];

    return owner && owner !== "."
      ? { kind: "per-unit", units: { [owner]: parsed } }
      : { kind: "repo-wide", counts: parsed };
  }

  if (values.every((value) => isCountMap(value))) {
    return { kind: "per-unit", units: parsed };
  }

  throw new Error(`${relative} is not a lint baseline this gate recognises.`);
};

export const removeLegacyBaseline = (file) => {
  rmSync(file);
};
