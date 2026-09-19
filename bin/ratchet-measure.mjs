import { oxlintExcludeArgs, pathTargets } from "./parse-oxlint-args.mjs";
import { withOxfmtConfig } from "./resolve-oxfmt-config.mjs";
import { withOxlintConfig } from "./resolve-oxlint-config.mjs";
import { spawnPackageBinCapture } from "./run-package-bin.mjs";

// Oxlint's own report carries the file count, which is the only way to tell a
// unit with a clean surface from a unit whose surface resolved to nothing. A
// baseline of zero over zero files is a gate measuring nothing while printing a
// pass, so a counted unit that reaches no files is a failure.
export const parseReport = (stdout) => {
  // A git hook runs with a different PATH and a different stdout, and anything
  // ahead of the report there — an engine warning from a package manager, a
  // Node deprecation — makes the whole capture invalid JSON. Start at the first
  // brace rather than trusting the stream to be clean. Spawning the tool's own
  // executable (never through a package manager) keeps most of that noise away
  // in the first place; this handles the rest.
  const start = stdout.indexOf("{");

  if (start === -1) {
    return undefined;
  }

  try {
    const report = JSON.parse(stdout.slice(start));
    return Array.isArray(report.diagnostics) ? report : undefined;
  } catch {
    return undefined;
  }
};

const tail = (text, lines = 8) =>
  text
    .trim()
    .split("\n")
    .slice(0, lines)
    .map((line) => `    ${line}`)
    .join("\n");

// Findings per rule code for one unit, measured from the unit's own directory
// with the unit's own targets.
export const measureFindings = (unit) => {
  const result = spawnPackageBinCapture(
    "oxlint",
    "oxlint",
    withOxlintConfig(
      [
        ...unit.options,
        "--format=json",
        ...oxlintExcludeArgs(unit.targets),
        ...pathTargets(unit.targets),
      ],
      unit.dir
    ),
    unit.dir
  );

  if (result.error) {
    return { failure: `oxlint could not run: ${result.error.message}` };
  }

  const report = parseReport(result.stdout ?? "");

  if (!report) {
    return {
      failure: `oxlint produced no JSON report (a measurement failure, not a pass)\n${tail(
        `${result.stdout ?? ""}${result.stderr ?? ""}` || "no output"
      )}`,
    };
  }

  if ((report.number_of_files ?? 0) === 0) {
    return {
      failure: `oxlint reached 0 files with targets ${unit.targets.join(
        " "
      )}, so the baseline for this unit measures nothing. Fix the targets in its \`lint\` script.`,
    };
  }

  const counts = {};

  for (const diagnostic of report.diagnostics) {
    const rule =
      typeof diagnostic.code === "string" ? diagnostic.code : "unknown";
    counts[rule] = (counts[rule] ?? 0) + 1;
  }

  return { counts, files: report.number_of_files };
};

// Formatting is mechanical, so it is a hard check rather than a ratcheted count:
// `--check` must pass. A repo that has just been moved onto a preset enabling a
// new formatter option (class sorting, say) can opt into ratcheting the count
// instead, by carrying an `unformatted` map in its baseline; that is the only
// case where an unformatted file does not fail outright.
export const measureFormatting = (unit, { counted }) => {
  const args = counted ? ["--list-different"] : ["--check"];
  const result = spawnPackageBinCapture(
    "oxfmt",
    "oxfmt",
    withOxfmtConfig([...args, ...unit.targets]),
    unit.dir
  );

  if (result.error) {
    return { failure: `oxfmt could not run: ${result.error.message}` };
  }

  const output = `${result.stdout ?? ""}`;

  if (!counted) {
    return result.status === 0
      ? { unformatted: 0 }
      : {
          failure: `formatting\n${tail(`${output}${result.stderr ?? ""}`)}`,
        };
  }

  return {
    unformatted: output
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.startsWith("Finished in"))
      .length,
  };
};

// One full measurement of the repo. Always every unit: a partial measurement
// that is then written as a whole baseline erases the units it did not visit,
// which is how one consumer lost most of its baseline in a single rebaseline.
export const measureRepo = (units, { ratchetUnformatted = false } = {}) => {
  const measurements = [];
  const failures = [];

  for (const unit of units) {
    const formatting = measureFormatting(unit, {
      counted: ratchetUnformatted && unit.counted,
    });

    if (formatting.failure) {
      failures.push(`${unit.name}: ${formatting.failure}`);
      continue;
    }

    if (!unit.counted) {
      measurements.push({ unit, counts: undefined, unformatted: 0 });
      continue;
    }

    const findings = measureFindings(unit);

    if (findings.failure) {
      failures.push(`${unit.name}: ${findings.failure}`);
      continue;
    }

    measurements.push({
      unit,
      counts: findings.counts,
      files: findings.files,
      unformatted: formatting.unformatted,
    });
  }

  return { measurements, failures };
};
