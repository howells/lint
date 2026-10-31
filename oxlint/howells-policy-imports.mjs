// Policies for module specifiers and package ownership. Package restrictions
// take their governed names and directories from the consumer.

import fs from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseSync, Visitor } from "oxc-parser";

// Node resolves relative ESM specifiers as URLs, not filesystem path strings.
// The existing boundary analyzers consume the raw specifier, so only spellings
// with the same interpretation in both can use the local-module allowance.
const RELATIVE_MODULE = /^\.{1,2}\//u;
const NON_CANONICAL_SPECIFIER = /[\\%?#]/u;
const WORKSPACE_DIRECTORIES = new Set(["apps", "packages"]);

const packageRootFor = (filename) => {
  let directory = path.dirname(filename);
  for (;;) {
    const manifest = path.join(directory, "package.json");
    if (fs.existsSync(manifest)) {
      const value = JSON.parse(fs.readFileSync(manifest, "utf8"));
      return value && typeof value === "object" && !Array.isArray(value)
        ? directory
        : undefined;
    }
    const parent = path.dirname(directory);
    // An absent workspace package manifest cannot make its parent the owner.
    if (
      parent === directory ||
      WORKSPACE_DIRECTORIES.has(path.basename(parent)) ||
      path.basename(directory) === "node_modules"
    )
      return undefined;
    directory = parent;
  }
};

const fileOwnership = (filename) => {
  if (!fs.statSync(filename).isFile()) return undefined;
  const root = packageRootFor(filename);
  if (!root) return undefined;
  const realFile = fs.realpathSync(filename);
  const realRoot = fs.realpathSync(root);
  if (
    packageRootFor(realFile) !== realRoot ||
    path.relative(root, filename) !== path.relative(realRoot, realFile) ||
    path.relative(root, filename).split(path.sep).includes("node_modules")
  )
    return undefined;
  return { root, realRoot };
};

// Oxlint 1.86's import/no-cycle and no-self-import omit dynamic edges. Establish
// a closed acyclic local graph before allowing one, rather than silently losing
// those checks. Type-only edges match no-cycle's existing ignoreTypes default.
const runtimeDependencies = (filename) => {
  if (!/\.[cm]?[jt]sx?$/u.test(filename)) return undefined;
  const parsed = parseSync(filename, fs.readFileSync(filename, "utf8"));
  if (parsed.errors.length > 0) return undefined;
  const dependencies = [];
  let unknown = false;
  const addSource = (node) => {
    if (node?.type !== "Literal" || typeof node.value !== "string")
      unknown = true;
    else dependencies.push(node.value);
  };
  new Visitor({
    ImportDeclaration(node) {
      if (
        node.importKind !== "type" &&
        (node.specifiers.length === 0 ||
          node.specifiers.some((specifier) => specifier.importKind !== "type"))
      )
        addSource(node.source);
    },
    ExportNamedDeclaration(node) {
      if (
        node.source &&
        node.exportKind !== "type" &&
        (node.specifiers.length === 0 ||
          node.specifiers.some((specifier) => specifier.exportKind !== "type"))
      )
        addSource(node.source);
    },
    ExportAllDeclaration(node) {
      if (node.exportKind !== "type") addSource(node.source);
    },
    ImportExpression(node) {
      addSource(node.source);
    },
    CallExpression(node) {
      if (node.callee.type === "Identifier" && node.callee.name === "require")
        unknown = true;
    },
    TSImportEqualsDeclaration(node) {
      if (node.importKind !== "type") unknown = true;
    },
  }).visit(parsed.program);
  return unknown ? undefined : dependencies;
};

export const createNoRuntimeDynamicImportsRule = (context) => {
  const allowLocalModules = context.options?.[0]?.allowLocalModules === true;
  const filename = context.filename;
  let owner;
  let checkedOwner = false;
  const localTargets = new Map();
  const provenFiles = new Set();

  const localFile = (from, specifier) => {
    if (!RELATIVE_MODULE.test(specifier)) return undefined;
    // Decode/normalize before ownership checks, including encoded parent
    // segments. Raw path.resolve() would misclassify those as local folders.
    const target = fileURLToPath(new URL(specifier, pathToFileURL(from)));
    const targetOwner = fileOwnership(target);
    return targetOwner &&
      owner.root === targetOwner.root &&
      owner.realRoot === targetOwner.realRoot &&
      target === path.resolve(path.dirname(from), specifier) &&
      ![...specifier].some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
      }) &&
      !NON_CANONICAL_SPECIFIER.test(specifier)
      ? target
      : undefined;
  };

  const acyclicLocalGraph = (target, ancestors) => {
    if (ancestors.has(target)) return false;
    if (provenFiles.has(target)) return true;
    const dependencies = runtimeDependencies(target);
    if (!dependencies) return false;
    const next = new Set(ancestors).add(target);
    for (const specifier of dependencies) {
      if (isBuiltin(specifier)) continue;
      const dependency = localFile(target, specifier);
      if (!dependency || !acyclicLocalGraph(dependency, next)) return false;
    }
    provenFiles.add(target);
    return true;
  };

  const isLocalModule = (source) => {
    if (
      source.type !== "Literal" ||
      typeof source.value !== "string" ||
      !RELATIVE_MODULE.test(source.value) ||
      !path.isAbsolute(filename)
    )
      return false;
    if (localTargets.has(source.value)) return localTargets.get(source.value);
    let local = false;
    try {
      if (!checkedOwner) {
        checkedOwner = true;
        owner = fileOwnership(filename);
      }
      const target = owner && localFile(filename, source.value);
      local = Boolean(target && acyclicLocalGraph(target, new Set([filename])));
    } catch {
      // A missing file, invalid URL/manifest or unreadable package cannot
      // establish ownership. Keep the original finding in all those cases.
      local = false;
    }
    localTargets.set(source.value, local);
    return local;
  };

  return {
    ImportExpression(node) {
      if (allowLocalModules && isLocalModule(node.source)) return;
      context.report({
        node,
        message: allowLocalModules
          ? "Use a static import instead. Deferred imports require a fixed relative string literal and a proven acyclic dependency graph within the same package."
          : "Runtime dynamic imports make package loading harder to trace and validate. Use a static import instead.",
      });
    },
  };
};

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

/** The package name a bare specifier belongs to, scope included. */
function packageNameOf(specifier) {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0];
}

/**
 * The subpaths a package declares literally in its `exports` map. A wildcard
 * pattern (`./components/*`) is deliberately not collected: it matches every
 * depth, so treating it as a declaration would neuter the depth rule for the
 * whole namespace. Only an exact key counts as "this deep path is public".
 */
function literalExportSubpaths(exportsField, into = new Set()) {
  if (!exportsField || typeof exportsField !== "object") {
    return into;
  }
  for (const key of Object.keys(exportsField)) {
    if (key.startsWith(".") && !key.includes("*")) {
      into.add(key);
    }
  }
  return into;
}

const exportsCache = new Map();

/** Read the target package's declared export subpaths, or `null` if unresolved. */
function declaredSubpaths(fromDirectory, packageName) {
  const cacheKey = `${fromDirectory}|${packageName}`;
  const cached = exportsCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let directory = fromDirectory;
  let found = null;
  for (;;) {
    const manifest = path.join(
      directory,
      "node_modules",
      ...packageName.split("/"),
      "package.json"
    );
    if (fs.existsSync(manifest)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
        found = literalExportSubpaths(parsed.exports);
      } catch {
        found = null;
      }
      break;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      break;
    }
    directory = parent;
  }

  exportsCache.set(cacheKey, found);
  return found;
}

/**
 * ESLint-style rule factory for `no-deep-package-imports`. A package that
 * publishes a flat shim per component must be imported through that shim; a
 * deeper internal path couples the consumer to the package's file layout.
 *
 * A path the target package declares literally in its own `exports` map is
 * public by the package's own account, so it is never reported - that reads the
 * answer off the package rather than asking every consumer to configure it.
 * `allow` remains for a specifier the manifest cannot settle (a package that is
 * not installed where the lint runs, for instance).
 *
 * @param {{ filename?: string, options?: Array<{ prefixes?: Array<{ prefix: string, depth: number, allow?: string[] }> }>, report: Function }} context
 */
export function createNoDeepPackageImportsRule(context) {
  const filename = normalizeFilename(context.filename ?? "");
  const prefixes = (context.options?.[0]?.prefixes ?? []).filter(
    (entry) =>
      typeof entry?.prefix === "string" && typeof entry?.depth === "number"
  );

  if (prefixes.length === 0) {
    return {};
  }

  const fromDirectory = path.dirname(filename);

  function isDeclaredExport(specifier) {
    const packageName = packageNameOf(specifier);
    const subpaths = declaredSubpaths(fromDirectory, packageName);
    if (!subpaths) {
      return false;
    }
    return subpaths.has(`.${specifier.slice(packageName.length)}`);
  }

  function checkSpecifier(node, specifier) {
    for (const entry of prefixes) {
      const root = `${entry.prefix}/`;
      if (!specifier.startsWith(root)) {
        continue;
      }
      const segments = specifier
        .slice(root.length)
        .split("/")
        .filter((segment) => segment !== "");
      if (segments.length <= entry.depth) {
        continue;
      }
      if ((entry.allow ?? []).includes(specifier)) {
        continue;
      }
      if (isDeclaredExport(specifier)) {
        continue;
      }

      const shim = `${entry.prefix}/${segments.slice(0, entry.depth).join("/")}`;
      context.report({
        message: `Import from \`${shim}\`; \`${specifier}\` reaches into the package's internals.`,
        node,
      });
      return;
    }
  }

  function checkSource(node) {
    const source = node.source;
    if (typeof source?.value === "string") {
      checkSpecifier(source, source.value);
    }
  }

  return {
    CallExpression(node) {
      if (
        node.callee?.type !== "Identifier" ||
        node.callee.name !== "require"
      ) {
        return;
      }
      const [argument] = node.arguments ?? [];
      if (argument?.type === "Literal" && typeof argument.value === "string") {
        checkSpecifier(argument, argument.value);
      }
    },
    ExportAllDeclaration: checkSource,
    ExportNamedDeclaration: checkSource,
    ImportDeclaration: checkSource,
    ImportExpression: checkSource,
  };
}

/**
 * ESLint-style rule factory for `no-out-of-bounds-package-imports`. A dependency
 * namespace belongs to one directory, which re-exports what the rest of the
 * workspace needs; every other file reaches it through that package's own
 * surface.
 *
 * With either list empty the rule reports nothing, so a half-configured rule is
 * inert rather than repo-wide.
 *
 * @param {{ filename?: string, options?: Array<{ packages?: string[], within?: string[] }>, report: Function }} context
 */
export function createNoOutOfBoundsPackageImportsRule(context) {
  const options = context.options?.[0] ?? {};
  const packages = options.packages ?? [];
  const within = options.within ?? [];

  if (packages.length === 0 || within.length === 0) {
    return {};
  }

  const filename = normalizeFilename(context.filename ?? "");
  const isOwner = within.some((directory) => {
    // A `within` entry is a path as it appears in a file path, so a leading
    // `./` or a trailing slash in the config is the same directory.
    const owner = normalizeFilename(directory).replace(/^\.?\/|\/$/gu, "");
    return (
      filename === owner ||
      filename.startsWith(`${owner}/`) ||
      filename.includes(`/${owner}/`)
    );
  });

  // Decide ownership once per file, before returning visitors: an owning file
  // does no per-node work at all.
  if (isOwner) {
    return {};
  }

  const owners = within.join(", ");

  function isRestricted(specifier) {
    return packages.some((entry) => {
      if (entry.endsWith("*")) {
        return specifier.startsWith(entry.slice(0, -1));
      }
      return specifier === entry || specifier.startsWith(`${entry}/`);
    });
  }

  function checkSource(node) {
    const specifier = node.source?.value;
    if (typeof specifier !== "string" || !isRestricted(specifier)) {
      return;
    }
    context.report({
      message: `"${specifier}" may only be imported inside ${owners}. Reach it through that package's own exports instead.`,
      node,
    });
  }

  return {
    ExportAllDeclaration: checkSource,
    ExportNamedDeclaration: checkSource,
    ImportDeclaration: checkSource,
  };
}
