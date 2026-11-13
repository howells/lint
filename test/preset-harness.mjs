import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { resolvePackageBin } from "../bin/run-package-bin.mjs";

export const execFileAsync = promisify(execFile);
export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
export const oxlintBin = path.join(repoRoot, "node_modules", ".bin", "oxlint");
export const corePresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "core.mjs")
).href;
export const gdpPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "gdp.mjs")
).href;
export const reactPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "react.mjs")
).href;
export const nextPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "next.mjs")
).href;
export const playwrightPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "playwright.mjs")
).href;

export const shadcnPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "shadcn.mjs")
).href;

// Oxlint resolves bare jsPlugin specifiers (e.g. Ultracite's opt-in
// github/sonarjs/react-doctor plugins) relative to the root config file's
// node_modules ancestry, and it requires the tsgolint executable whenever
// type-aware mode is on. Each fixture therefore gets a node_modules symlink
// back to this package's own, which gives it the dependency ancestry a real
// consumer install has; resolving tsgolint the way the binaries do proves that
// resolution path keeps working.
//
// The fixtures used to live *inside* the repo's node_modules for the same
// reason. Oxlint 1.78 skips any path it considers ignored — node_modules, a
// dot-prefixed directory, anything matched by .gitignore — even when that path
// is named explicitly on the command line, and `--no-ignore` does not lift it.
// Every fixture came back as "No files found to lint" instead of running the
// presets, so they moved outside the repo entirely.
// realpathSync because macOS resolves os.tmpdir() to a symlink: Oxlint reports
// the symlinked path while the JS-plugin bridge derives its project root from
// the real cwd, and eslint-plugin-sonarjs then throws "is not nested under
// topDir" — which aborts the whole JS-plugin pass for that file, taking the
// `howells/*` rules under test down with it.
export const fixtureBase = path.join(
  realpathSync(tmpdir()),
  "howells-lint-preset-fixtures"
);
export const tsgolintPath = resolvePackageBin("oxlint-tsgolint", "tsgolint");

export async function makeFixtureRoot() {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, "case-"));
  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  return root;
}

export async function writeFixture(root, relativePath, source) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source, { flag: "w" });
}

export async function runOxlint(root, targets = ["src"]) {
  try {
    const { stderr, stdout } = await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        ...targets.map((target) => path.join(root, target)),
      ],
      { cwd: root, env: { ...process.env, OXLINT_TSGOLINT_PATH: tsgolintPath } }
    );
    // A clean run may print nothing at all, and `diagnosticsForRule` parses
    // whatever comes back, so an empty stdout becomes an empty report.
    return { status: 0, stderr, stdout: stdout.trim() === "" ? "[]" : stdout };
  } catch (error) {
    return {
      status: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

export function resolvedRules(preset, resolved = {}) {
  for (const extended of preset.extends ?? []) {
    resolvedRules(extended, resolved);
  }
  Object.assign(resolved, preset.rules ?? {});
  return resolved;
}

export function resolvedJsPluginNames(preset, names = []) {
  for (const extended of preset.extends ?? []) {
    resolvedJsPluginNames(extended, names);
  }
  for (const plugin of preset.jsPlugins ?? []) {
    names.push(plugin.name);
  }
  return names;
}

export function ruleNamesWithPrefix(preset, prefix) {
  return Object.keys(resolvedRules(preset)).filter((ruleName) =>
    ruleName.startsWith(prefix)
  );
}

export function diagnosticsForRule(stdout, code) {
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? report;
  return diagnostics.filter((diagnostic) => diagnostic.code === code);
}

export async function writeTypedFixtureConfig(root, config) {
  await writeFixture(root, "oxlint.config.mjs", config);
  await writeFixture(
    root,
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Bundler",
      },
      include: ["src/**/*"],
    })
  );
}
