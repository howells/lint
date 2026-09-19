import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
export const ratchetBin = path.join(repoRoot, "bin", "howells-ratchet.mjs");

// Fixtures live outside the repo, with a node_modules symlink back to it, the
// way the other binaries' fixtures do: under the repo they would sit inside a
// gitignored directory, and Oxlint skips ignored paths even when they are named
// on the command line.
const fixtureBase = path.join(
  realpathSync(tmpdir()),
  "howells-lint-ratchet-fixtures"
);

// A plain .oxlintrc.json rather than a preset import: these tests are about the
// ratchet's arithmetic, so the rule set has to be small and fixed. Two rules,
// one finding each per offending file, makes every expected count countable by
// hand.
const OXLINTRC = `${JSON.stringify(
  { rules: { "no-debugger": "error", eqeqeq: "error" } },
  null,
  2
)}\n`;

// Fixture manifests and configs are written formatted: formatting is a hard
// check, so a fixture whose own JSON is unformatted fails before it measures
// anything.
const asJsonFile = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const offendingSource = (name) =>
  `export const ${name} = (value) => {\n  debugger;\n  return value == 1;\n};\n`;

export const cleanSource = (name) =>
  `export const ${name} = (value) => {\n  return value === 1;\n};\n`;

/**
 * Build a fixture repo.
 *
 * @param {object} spec
 * @param {Record<string, unknown>} [spec.rootManifest] the root package.json
 * @param {Record<string, Record<string, unknown>>} [spec.packages] manifests by directory
 * @param {Record<string, string>} [spec.files] file contents by path
 * @param {string[]} [spec.workspaceGlobs] pnpm-workspace.yaml `packages:` entries
 * @param {boolean} [spec.oxlintrc] write the shared `.oxlintrc.json`; off for a
 *   fixture supplying its own Oxlint config per unit
 */
export const makeFixture = async ({
  rootManifest = { name: "fixture", scripts: { lint: "howells-check src" } },
  packages = {},
  files = {},
  workspaceGlobs = ["apps/*", "packages/*"],
} = {}) => {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, "case-"));

  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  await writeFile(
    path.join(root, "package.json"),
    asJsonFile({ type: "module", ...rootManifest })
  );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    `packages:\n${workspaceGlobs.map((glob) => `  - "${glob}"`).join("\n")}\n`
  );
  await writeFile(path.join(root, ".oxlintrc.json"), OXLINTRC);

  for (const [directory, manifest] of Object.entries(packages)) {
    await mkdir(path.join(root, directory), { recursive: true });
    await writeFile(
      path.join(root, directory, "package.json"),
      asJsonFile({ type: "module", ...manifest })
    );
    // Each unit is measured from its own directory, and Oxlint discovers its
    // config there rather than walking up, so every unit carries the same rc.
    await writeFile(path.join(root, directory, ".oxlintrc.json"), OXLINTRC);
  }

  for (const [file, contents] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), contents);
  }

  // Formatting is a hard check, and the preset reformats a manifest (key order
  // included), so a fixture is formatted once on creation. A test that wants an
  // unformatted file writes it afterwards.
  await formatFixture(root);

  return root;
};

// Run the formatter over a fixture, so the ratchet's hard formatting check is
// never what a test trips over.
export const formatFixture = async (root) => {
  await execFileAsync(
    process.execPath,
    [path.join(repoRoot, "bin", "howells-oxfmt.mjs"), "--write", "."],
    { cwd: root }
  );
};

export const runRatchet = async (root, args = [], { env } = {}) => {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [ratchetBin, "--root", root, ...args],
      {
        cwd: root,
        env: { ...process.env, ...env },
        maxBuffer: 64 * 1024 * 1024,
      }
    );
    return { status: 0, stdout, stderr };
  } catch (error) {
    return {
      status: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
  }
};

export const runRatchetJson = async (root, args = [], options) => {
  const result = await runRatchet(root, ["--json", ...args], options);
  return { ...result, json: JSON.parse(result.stdout) };
};
