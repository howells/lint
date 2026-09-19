// The policy rules that govern which module specifier a file may write. Both are
// param-driven: the governed package names and directories are supplied by the
// consumer, so neither rule carries a project's package names.

import fs from "node:fs";
import path from "node:path";

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
  const isOwner = within.some(
    (directory) =>
      filename === directory ||
      filename.startsWith(`${directory}/`) ||
      filename.includes(`/${directory}/`)
  );

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
