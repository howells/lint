import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  cleanSource,
  formatFixture,
  makeFixture,
  offendingSource,
  runRatchet,
  runRatchetJson,
} from "./ratchet-fixture.mjs";

const baselineOf = async (root) =>
  JSON.parse(await readFile(path.join(root, "lint-baseline.json"), "utf-8"));

// A single-package repo: one unit at the root, targets from its own `lint`
// script, one finding of each rule in the one offending file.
const singleUnitFixture = () =>
  makeFixture({
    rootManifest: { name: "single", scripts: { lint: "howells-check src" } },
    files: { "src/a.js": offendingSource("a") },
  });

// A monorepo whose packages name different surfaces, one of them with an
// exclude. The excluded file holds findings that must not be counted.
const monorepoFixture = () =>
  makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
      "packages/db": {
        name: "db",
        scripts: { lint: "howells-check src '!**/*.gen.js'" },
      },
      "packages/config": {
        name: "config",
        scripts: { lint: "howells-oxfmt --check ." },
      },
    },
    files: {
      "apps/web/src/a.js": offendingSource("a"),
      "packages/db/src/b.js": offendingSource("b"),
      "packages/db/src/schema.gen.js": `${offendingSource("c")}${offendingSource("d")}`,
      "packages/config/index.js": cleanSource("config"),
    },
  });

test("a single unit measures its own targets and writes a baseline", async () => {
  const root = await singleUnitFixture();

  const written = await runRatchet(root, ["--write"]);
  assert.equal(written.status, 0);

  assert.deepEqual(await baselineOf(root), {
    version: 1,
    units: { ".": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 } },
  });

  const checked = await runRatchet(root);
  assert.equal(checked.status, 0);
  assert.match(
    checked.stdout,
    /ratchet ok: 2 findings across 1 unit \(baseline 2\)/u
  );
});

test("a monorepo keys counts by package and honours an exclude", async () => {
  const root = await monorepoFixture();

  assert.equal((await runRatchet(root, ["--write"])).status, 0);

  const baseline = await baselineOf(root);

  // packages/db's exclude keeps schema.gen.js out, so db counts one of each
  // rule, not three. A format-only unit carries no counts at all.
  assert.deepEqual(baseline.units, {
    "apps/web": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
    "packages/db": { "eslint(eqeqeq)": 1, "eslint(no-debugger)": 1 },
  });
  assert.equal(baseline.units["packages/config"], undefined);

  const { json } = await runRatchetJson(root);
  assert.equal(json.ok, true);
  assert.equal(json.total, 4);
  assert.equal(json.units, 2);
});

test("dropping the exclude is a rise the gate catches", async () => {
  const root = await monorepoFixture();
  await runRatchet(root, ["--write"]);

  const manifestPath = path.join(root, "packages/db/package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
  manifest.scripts.lint = "howells-check src";
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await formatFixture(root);

  const { json, status } = await runRatchetJson(root);

  assert.equal(status, 1);
  assert.equal(json.ok, false);
  assert.deepEqual(
    json.risen.map(
      ({ unit, rule, now, was }) => `${unit} ${rule} ${now}>${was}`
    ),
    ["packages/db eslint(eqeqeq) 3>1", "packages/db eslint(no-debugger) 3>1"]
  );
});

test("finding no unit is a failure, never a pass over nothing", async () => {
  const root = await makeFixture({
    rootManifest: { name: "none", scripts: { lint: "turbo run lint" } },
    files: { "src/a.js": offendingSource("a") },
  });

  const { status, json } = await runRatchetJson(root, ["--write"]);

  assert.equal(status, 2);
  assert.equal(json.ok, false);
  assert.match(json.error, /found no lint units/u);
});

test("a unit that reaches zero files is a failure, never a zero baseline", async () => {
  const root = await makeFixture({
    rootManifest: { name: "empty", scripts: { lint: "howells-check src" } },
    files: { "src/notes.md": "# nothing lintable\n" },
  });

  const { status, json } = await runRatchetJson(root, ["--write"]);

  assert.equal(status, 2);
  assert.match(json.error, /reached 0 files/u);
});

test("a count that rose fails the check", async () => {
  const root = await singleUnitFixture();
  await runRatchet(root, ["--write"]);
  await writeFile(path.join(root, "src/b.js"), offendingSource("b"));

  const { status, stderr } = await runRatchet(root);

  assert.equal(status, 1);
  assert.match(stderr, /2 counts rose/u);
  assert.match(stderr, /\. {2}eslint\(no-debugger\) {2}2 > 1/u);
});

test("a count that fell passes and asks for a rebaseline", async () => {
  const root = await singleUnitFixture();
  await writeFile(path.join(root, "src/b.js"), offendingSource("b"));
  await runRatchet(root, ["--write"]);
  await rm(path.join(root, "src/b.js"));

  const { status, stdout } = await runRatchet(root);

  assert.equal(status, 0);
  assert.match(stdout, /ratchet ok: 2 findings across 1 unit \(baseline 4\)/u);
  assert.match(stdout, /2 counts fell — run `pnpm lint:rebaseline`/u);
  assert.match(stdout, /eslint\(no-debugger\) {2}2 -> 1/u);
});

test("a rule that disappeared entirely counts as a fall", async () => {
  const root = await singleUnitFixture();
  await runRatchet(root, ["--write"]);
  await writeFile(path.join(root, "src/a.js"), cleanSource("a"));
  await writeFile(path.join(root, "src/b.js"), offendingSource("b"));

  const { stdout, status } = await runRatchet(root);

  assert.equal(status, 0);
  assert.match(stdout, /ratchet ok: 2 findings/u);
});

test("--write refuses a rise and names it", async () => {
  const root = await singleUnitFixture();
  await runRatchet(root, ["--write"]);
  const before = await baselineOf(root);
  await writeFile(path.join(root, "src/b.js"), offendingSource("b"));

  const { status, stderr } = await runRatchet(root, ["--write"]);

  assert.equal(status, 1);
  assert.match(stderr, /this would raise the baseline/u);
  assert.match(stderr, /eslint\(eqeqeq\) {2}2 > 1/u);
  assert.deepEqual(await baselineOf(root), before);
});

test("--write --allow-rise records the higher counts", async () => {
  const root = await singleUnitFixture();
  await runRatchet(root, ["--write"]);
  await writeFile(path.join(root, "src/b.js"), offendingSource("b"));

  const { status } = await runRatchet(root, ["--write", "--allow-rise"]);

  assert.equal(status, 0);
  assert.deepEqual((await baselineOf(root)).units["."], {
    "eslint(eqeqeq)": 2,
    "eslint(no-debugger)": 2,
  });
});

test("a unit that went clean keeps its place in the baseline", async () => {
  const root = await monorepoFixture();
  await runRatchet(root, ["--write"]);
  await writeFile(path.join(root, "apps/web/src/a.js"), cleanSource("a"));

  const { status } = await runRatchet(root, ["--write"]);

  assert.equal(status, 0);

  // A unit whose count fell to nothing is still measured and still written, as
  // an empty map. Dropping it would leave nothing to ratchet against, and the
  // next finding there would compare to a unit that had disappeared.
  const { units } = await baselineOf(root);
  assert.deepEqual(Object.keys(units), ["apps/web", "packages/db"]);
  assert.deepEqual(units["apps/web"], {});

  await writeFile(path.join(root, "apps/web/src/a.js"), offendingSource("a"));
  const { status: after, stderr } = await runRatchet(root);
  assert.equal(after, 1);
  assert.match(stderr, /apps\/web/u);
});

test("noise on stdout ahead of the JSON report does not break the measurement", async () => {
  const root = await singleUnitFixture();
  const noise = path.join(root, "noise.cjs");
  await writeFile(
    noise,
    "process.stdout.write('WARN Unsupported engine: wanted node@x\\n');\n"
  );

  const written = await runRatchet(root, ["--write"], {
    env: { NODE_OPTIONS: `--require ${noise}` },
  });

  assert.equal(written.status, 0);
  assert.deepEqual((await baselineOf(root)).units["."], {
    "eslint(eqeqeq)": 1,
    "eslint(no-debugger)": 1,
  });
});

test("an unformatted file fails outright unless the repo ratchets it", async () => {
  const root = await singleUnitFixture();
  await writeFile(path.join(root, "src/ugly.js"), "export const ugly =    1\n");

  const hard = await runRatchetJson(root, ["--write"]);
  assert.equal(hard.status, 2);
  assert.match(hard.json.error, /formatting/u);

  const opted = await runRatchet(root, ["--write", "--unformatted"]);
  assert.equal(opted.status, 0);
  assert.deepEqual((await baselineOf(root)).unformatted, { ".": 1 });

  assert.equal((await runRatchet(root)).status, 0);

  await writeFile(
    path.join(root, "src/ugly2.js"),
    "export const ugly2 =    2\n"
  );
  const risen = await runRatchet(root);
  assert.equal(risen.status, 1);
  assert.match(risen.stderr, /unformatted files {2}2 > 1/u);
});

test("a unit's format check reads that unit's own oxfmt config", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
    },
    files: { "apps/web/src/a.js": offendingSource("a") },
  });

  // The root formats wide and the package narrow, so one file is formatted by
  // the root's settings and unformatted by the package's. Both configs are
  // spellings that need an explicit --config, which is what made resolving them
  // from the wrong directory silent: the gate pinned the root's config and
  // passed a file the package's own lint run would reject.
  await writeFile(
    path.join(root, "oxfmt.config.mjs"),
    "export default { printWidth: 200 };\n"
  );
  await writeFile(
    path.join(root, "apps/web/oxfmt.config.mjs"),
    "export default { printWidth: 40 };\n"
  );
  await writeFile(
    path.join(root, "apps/web/src/wide.js"),
    "export const wide = (alpha, bravo, charlie) => alpha + bravo + charlie + 1;\n"
  );

  const narrow = await runRatchetJson(root, ["--write"]);
  assert.equal(narrow.status, 2);
  assert.match(narrow.json.error, /apps\/web: formatting/u);
  assert.match(narrow.json.error, /wide\.js/u);

  // The other side of it: with the package's config gone the same file is
  // formatted by the root's width and the gate passes, so the failure above
  // reads the package's config rather than anything else about the file.
  await rm(path.join(root, "apps/web/oxfmt.config.mjs"));
  assert.equal((await runRatchet(root, ["--write"])).status, 0);
});

test("a unit's findings are counted under that unit's own oxlint config", async () => {
  const root = await makeFixture({
    rootManifest: { name: "mono", scripts: { lint: "turbo run lint" } },
    packages: {
      "apps/web": { name: "web", scripts: { lint: "howells-check src" } },
    },
    files: { "apps/web/src/a.js": offendingSource("a") },
    oxlintrc: false,
  });

  // `.mjs` is a spelling Oxlint does not discover, so it is the one case where
  // the wrapper pins a config with --config - and therefore the only place an
  // Oxlint-side cwd slip could pin the root's config over the package's. The
  // root enables no-console only and the package eqeqeq only, so which rule is
  // counted names which config was read. Neither is on by Oxlint's defaults,
  // unlike no-debugger, which fires whatever the config says and so cannot tell
  // the two configs apart.
  await writeFile(
    path.join(root, "oxlint.config.mjs"),
    'export default { rules: { "no-console": "error" } };\n'
  );
  await writeFile(
    path.join(root, "apps/web/oxlint.config.mjs"),
    'export default { rules: { eqeqeq: "error" } };\n'
  );
  await writeFile(
    path.join(root, "apps/web/src/a.js"),
    "export const a = (value) => {\n  console.log(value);\n  return value == 1;\n};\n"
  );

  assert.equal((await runRatchet(root, ["--write"])).status, 0);

  assert.deepEqual((await baselineOf(root)).units, {
    "apps/web": { "eslint(eqeqeq)": 1 },
  });
});

test("an unknown argument is refused rather than ignored", async () => {
  const root = await singleUnitFixture();

  const { status, stderr } = await runRatchet(root, ["--update"]);

  assert.equal(status, 2);
  assert.match(stderr, /unknown argument --update/u);
});

test("a check with no baseline says how to make one", async () => {
  const root = await singleUnitFixture();

  const { status, json } = await runRatchetJson(root);

  assert.equal(status, 2);
  assert.match(json.error, /Run `howells-ratchet --write` once/u);
});
