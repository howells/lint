import { existsSync, globSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const explicitConfigPrefixes = ["--config=", "-c="];
const projectConfigNames = [
  "oxfmt.config.ts",
  "oxfmt.config.mts",
  "oxfmt.config.cts",
  "oxfmt.config.js",
  "oxfmt.config.mjs",
  "oxfmt.config.cjs",
];
const autoDiscoveredConfigNames = [".oxfmtrc.json", ".oxfmtrc.jsonc"];
const packagedConfigPath = fileURLToPath(
  new URL("../oxfmt/index.mjs", import.meta.url)
);

function hasExplicitConfig(args) {
  return args.some(
    (arg) =>
      arg === "--config" ||
      arg === "-c" ||
      explicitConfigPrefixes.some((prefix) => arg.startsWith(prefix))
  );
}

function findProjectConfig(cwd) {
  let directory = path.resolve(cwd);

  while (true) {
    const projectConfigName = projectConfigNames.find((name) =>
      existsSync(path.join(directory, name))
    );
    if (projectConfigName) {
      return {
        path: path.join(directory, projectConfigName),
        requiresFlag: true,
      };
    }

    if (
      autoDiscoveredConfigNames.some((name) =>
        existsSync(path.join(directory, name))
      )
    ) {
      return { requiresFlag: false };
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

const configGlobs = [...projectConfigNames, ...autoDiscoveredConfigNames].map(
  (name) => `**/${name}`
);

const isDirectory = (target) => {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
};

// A pinned `--config` applies to every file in the run, so a write across a
// directory that holds its own configs deeper down formats them to the pinned
// settings and never reads theirs. Name the configs being bypassed rather than
// leaving it to be rediscovered per repo.
export function shadowedOxfmtConfigs(targets, cwd = process.cwd()) {
  const pinned = findProjectConfig(cwd);
  if (!pinned?.path) {
    return [];
  }

  const found = new Set();

  for (const target of targets) {
    const resolved = path.resolve(cwd, target);
    if (!isDirectory(resolved)) {
      continue;
    }

    for (const match of globSync(configGlobs, {
      cwd: resolved,
      exclude: (candidate) => candidate.includes("node_modules"),
    })) {
      const absolute = path.resolve(resolved, match);
      if (absolute !== pinned.path) {
        found.add(path.relative(cwd, absolute) || absolute);
      }
    }
  }

  return [...found].sort();
}

export function warnOnShadowedOxfmtConfigs(targets, cwd = process.cwd()) {
  const shadowed = shadowedOxfmtConfigs(targets, cwd);
  if (shadowed.length === 0) {
    return shadowed;
  }

  process.stderr.write(
    `@howells/lint: formatting from here pins one oxfmt config, so ${shadowed.length} nested config${
      shadowed.length === 1 ? "" : "s"
    } will not be read:\n${shadowed
      .map((entry) => `  ${entry}\n`)
      .join("")}Run the formatter from each package directory, or name explicit paths, to use their settings.\n`
  );

  return shadowed;
}

export function withOxfmtConfig(args, cwd = process.cwd()) {
  if (hasExplicitConfig(args)) {
    return args;
  }

  const projectConfig = findProjectConfig(cwd);
  if (projectConfig?.requiresFlag) {
    return ["--config", projectConfig.path, ...args];
  }

  if (projectConfig) {
    return args;
  }

  return ["--config", packagedConfigPath, ...args];
}
