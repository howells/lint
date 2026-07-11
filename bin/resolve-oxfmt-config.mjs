import { existsSync } from "node:fs";
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
