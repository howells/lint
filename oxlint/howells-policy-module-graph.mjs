import fs from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseSync, visitorKeys } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";

const RELATIVE_MODULE = /^\.{1,2}\//u;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/u;
const WORKSPACE_DIRECTORIES = new Set(["apps", "packages"]);
const OPAQUE_LOADER_KEYS = new Set([
  "createRequire",
  "eval",
  "getBuiltinModule",
  "mainModule",
  "require",
]);
const RUNTIME_NAMESPACES = new Set(["global", "globalThis", "process"]);
const RUNTIME_TS_NODES = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
  "TSInstantiationExpression",
  "TSEnumDeclaration",
  "TSEnumMember",
  "TSModuleDeclaration",
  "TSModuleBlock",
  "TSParameterProperty",
  "TSExportAssignment",
  "TSImportEqualsDeclaration",
]);
const EXPRESSION_WRAPPERS = new Set([
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
  "TSInstantiationExpression",
]);

const unwrap = (node) => {
  while (EXPRESSION_WRAPPERS.has(node.type)) node = node.expression;
  return node;
};

const literalSpecifier = (node) =>
  node?.type === "Literal" &&
  typeof node.value === "string" &&
  !node.raw?.includes("\\")
    ? node.value
    : undefined;

const canonicalSpecifier = (specifier) =>
  specifier.length > 0 &&
  !/[\\%?#]/u.test(specifier.replace(/^#/u, "")) &&
  ![...specifier].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });

const propertyName = (node) => {
  const key = node.property ?? node.key;
  if (key.type === "Literal") return key.value;
  return !node.computed && key.type === "Identifier" ? key.name : undefined;
};

const staticPropertyKey = (node, parent) =>
  parent &&
  !parent.computed &&
  !parent.shorthand &&
  ((parent.type === "MemberExpression" && parent.property === node) ||
    (["Property", "PropertyDefinition", "MethodDefinition"].includes(
      parent.type
    ) &&
      parent.key === node));

const runtimeNamespace = (node) => {
  node = unwrap(node);
  if (node.type === "Identifier" && RUNTIME_NAMESPACES.has(node.name))
    return node.name === "process" ? "process" : "global";
  if (
    node.type === "MemberExpression" &&
    runtimeNamespace(node.object) === "global"
  ) {
    const key = propertyName(node);
    if (key === "process") return "process";
    if (key === "global" || key === "globalThis") return "global";
  }
  return undefined;
};

const namespacePattern = (pattern, namespace) =>
  pattern.type === "ObjectPattern" &&
  pattern.properties.every((property) => {
    if (property.type !== "Property") return false;
    const key = propertyName(property);
    if (key === undefined || OPAQUE_LOADER_KEYS.has(key)) return false;
    if (namespace === "global" && RUNTIME_NAMESPACES.has(key))
      return namespacePattern(
        property.value,
        key === "process" ? "process" : "global"
      );
    return true;
  });

const namespaceUse = (node, parent) => {
  if (parent?.type === "UnaryExpression" && parent.operator === "typeof")
    return true;
  if (parent?.type === "MemberExpression" && parent.object === node)
    return propertyName(parent) !== undefined;
  if (parent?.type === "VariableDeclarator" && parent.init === node)
    return namespacePattern(parent.id, runtimeNamespace(node));
  if (parent?.type === "AssignmentExpression" && parent.right === node)
    return namespacePattern(parent.left, runtimeNamespace(node));
  return false;
};

// Skip erased TypeScript, including annotations containing typeof require.
// Runtime namespace/enum bodies and expression wrappers still need inspection.
const visitRuntime = (node, parent, visit) => {
  if (
    !node ||
    node.declare ||
    node.importKind === "type" ||
    node.exportKind === "type" ||
    (node.type.startsWith("TS") && !RUNTIME_TS_NODES.has(node.type))
  )
    return;
  if (visit(node, parent) === false) return;
  for (const key of visitorKeys[node.type] ?? []) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const entry of child) visitRuntime(entry, node, visit);
    } else visitRuntime(child, node, visit);
  }
};

// A module.require member may be invoked directly or with its receiver supplied
// through .call. Its key can be an immutable local string. Prefix slicing is
// bounded to characters already known, so an unknown suffix cannot change it.
// This models loader syntax under standard String/Function intrinsics; it does
// not evaluate source or infer values returned by arbitrary functions.
const commonJsMemberCalls = (program) => {
  const parents = new Map();
  const identifiers = new Map();
  const declarations = new Map();
  const members = [];
  let intrinsicEscape = false;
  visitRuntime(program, undefined, (node, parent) => {
    parents.set(node, parent);
    if (node.type === "Identifier") {
      if (!identifiers.has(node.name)) identifiers.set(node.name, []);
      identifiers.get(node.name).push(node);
      if (
        node.name === "Function" ||
        (node.name === "String" &&
          !(
            parent?.type === "CallExpression" &&
            parent.callee === node &&
            !parent.optional
          ))
      )
        intrinsicEscape = true;
      if (
        ["globalThis", "global"].includes(node.name) &&
        !(
          parent?.type === "MemberExpression" &&
          parent.object === node &&
          propertyName(parent) !== undefined
        )
      )
        intrinsicEscape = true;
    }
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
      if (!declarations.has(node.id.name)) declarations.set(node.id.name, []);
      declarations.get(node.id.name).push(node);
    }
    if (node.type === "MemberExpression") {
      members.push(node);
      if (
        ["String", "Function", "getPrototypeOf", "setPrototypeOf"].includes(
          propertyName(node)
        ) ||
        (node.computed &&
          propertyName(node) === undefined &&
          node.object.type === "Identifier" &&
          node.object.name === "globalThis")
      )
        intrinsicEscape = true;
    }
  });
  const blockFor = (node) => {
    for (
      let current = parents.get(node);
      current;
      current = parents.get(current)
    ) {
      if (["BlockStatement", "Program"].includes(current.type)) return current;
      if (/Function|Method/u.test(current.type)) return undefined;
    }
    return undefined;
  };
  const stringPrefix = (node) => {
    node = unwrap(node);
    if (node.type === "Literal" && typeof node.value === "string")
      return { prefix: node.value, complete: true };
    if (node.type === "BinaryExpression" && node.operator === "+") {
      const left = stringPrefix(node.left);
      if (!left || !left.complete) return left;
      const right = stringPrefix(node.right);
      return {
        prefix: left.prefix + (right?.prefix ?? ""),
        complete: right?.complete === true,
      };
    }
    if (
      !intrinsicEscape &&
      node.type === "CallExpression" &&
      !node.optional &&
      node.callee.type === "MemberExpression" &&
      !node.callee.optional &&
      propertyName(node.callee) === "slice" &&
      node.arguments.length === 2
    ) {
      const value = stringPrefix(node.callee.object);
      const [start, end] = node.arguments.map((argument) =>
        argument.type === "Literal" ? argument.value : undefined
      );
      if (
        value &&
        Number.isInteger(start) &&
        Number.isInteger(end) &&
        start >= 0 &&
        end >= start &&
        end <= value.prefix.length
      )
        return { prefix: value.prefix.slice(start, end), complete: true };
    }
    return undefined;
  };
  const keyFor = (member) => {
    if (!member.computed) return member.property.name;
    let key = member.property;
    if (key.type === "Identifier") {
      const values = declarations.get(key.name);
      if (values?.length !== 1) return undefined;
      const declaration = values[0];
      const statement = parents.get(declaration);
      if (
        !declaration.init ||
        parents.get(statement) !== blockFor(key) ||
        declaration.end > key.start ||
        identifiers
          .get(key.name)
          .some(
            (reference) =>
              reference !== declaration.id &&
              !(
                parents.get(reference)?.type === "MemberExpression" &&
                parents.get(reference).computed &&
                parents.get(reference).property === reference
              )
          )
      )
        return undefined;
      key = declaration.init;
    }
    const value = stringPrefix(key);
    return value?.complete ? value.prefix : undefined;
  };
  const allowed = new Set();
  const calls = [];
  const expressionParent = (node) => {
    while (parents.get(node) && EXPRESSION_WRAPPERS.has(parents.get(node).type))
      node = parents.get(node);
    return { node, parent: parents.get(node) };
  };
  for (const member of members) {
    const receiver = unwrap(member.object);
    if (
      member.optional ||
      receiver.type !== "Identifier" ||
      receiver.name !== "module" ||
      keyFor(member) !== "require"
    )
      continue;
    let { node: loader, parent } = expressionParent(member);
    const references = [receiver];
    if (
      parent?.type === "LogicalExpression" &&
      parent.operator === "&&" &&
      parent.right === loader &&
      unwrap(parent.left).type === "Identifier" &&
      unwrap(parent.left).name === "module"
    ) {
      references.push(unwrap(parent.left));
      ({ node: loader, parent } = expressionParent(parent));
    }
    let argument;
    if (
      parent?.type === "CallExpression" &&
      parent.callee === loader &&
      !parent.optional &&
      parent.arguments.length === 1
    )
      argument = parent.arguments[0];
    else if (
      !intrinsicEscape &&
      parent?.type === "MemberExpression" &&
      !parent.optional &&
      parent.object === loader &&
      propertyName(parent) === "call"
    ) {
      const call = parents.get(parent);
      if (
        call?.type === "CallExpression" &&
        call.callee === parent &&
        !call.optional &&
        call.arguments.length === 2 &&
        unwrap(call.arguments[0]).type === "Identifier" &&
        unwrap(call.arguments[0]).name === "module"
      ) {
        references.push(unwrap(call.arguments[0]));
        argument = call.arguments[1];
      }
    }
    if (!argument) continue;
    allowed.add(member);
    for (const reference of references) allowed.add(reference);
    calls.push(argument);
  }
  return { allowed, calls, parents };
};

const runtimeDependencies = (filename, owner) => {
  const source = fs.readFileSync(filename, "utf8");
  if (filename.endsWith(".json")) {
    JSON.parse(source);
    return [];
  }
  if (filename.endsWith(".css")) {
    // CSS is an asset leaf, not an unparsed stylesheet dependency graph.
    // Decline imports and escaped spellings that could conceal an at-rule.
    return /\\|@import\b/iu.test(source.replace(/\/\*[\s\S]*?\*\//gu, ""))
      ? undefined
      : [];
  }
  if (!SOURCE_FILE.test(filename)) return undefined;
  const parsed = parseSync(filename, source);
  if (parsed.errors.length > 0) return undefined;
  const dependencies = [];
  const memberCalls = commonJsMemberCalls(parsed.program);
  let unknown = false;
  let moduleSyntax = false;
  let commonJsUse = false;
  const addSource = (node, kind) => {
    const specifier = literalSpecifier(node);
    if (specifier === undefined) unknown = true;
    else dependencies.push({ specifier, kind });
  };
  const moduleApi = (node, specifiers) => {
    if (["module", "node:module", "vm", "node:vm"].includes(node.value))
      unknown = true;
    if (
      ["process", "node:process"].includes(node.value) &&
      specifiers.some(
        (item) =>
          !["ImportSpecifier", "ExportSpecifier"].includes(item.type) ||
          ((item.imported ?? item.local)?.name ??
            (item.imported ?? item.local)?.value) === "default"
      )
    )
      unknown = true;
    if (
      specifiers.some((item) =>
        ["createRequire", "getBuiltinModule", "mainModule"].includes(
          (item.imported ?? item.local)?.name ??
            (item.imported ?? item.local)?.value
        )
      )
    )
      unknown = true;
  };
  for (const argument of memberCalls.calls) {
    commonJsUse = true;
    addSource(argument, "require");
  }

  visitRuntime(parsed.program, undefined, (node, parent) => {
    switch (node.type) {
      case "ImportDeclaration": {
        const values = node.specifiers.filter(
          (item) => item.importKind !== "type"
        );
        if (
          node.importKind === "type" ||
          (node.specifiers.length > 0 && values.length === 0)
        )
          return false;
        moduleSyntax = true;
        addSource(node.source, "import");
        moduleApi(node.source, values);
        return false;
      }
      case "ExportNamedDeclaration": {
        const values = node.specifiers.filter(
          (item) => item.exportKind !== "type"
        );
        if (
          node.exportKind === "type" ||
          (node.specifiers.length > 0 && values.length === 0)
        )
          return false;
        moduleSyntax = true;
        if (node.source) {
          addSource(node.source, "import");
          moduleApi(node.source, values);
          return false;
        }
        break;
      }
      case "ExportAllDeclaration":
        if (node.exportKind === "type") return false;
        moduleSyntax = true;
        addSource(node.source, "import");
        moduleApi(node.source, [{ type: "ExportNamespaceSpecifier" }]);
        return false;
      case "ExportDefaultDeclaration":
        moduleSyntax = true;
        break;
      case "MetaProperty":
        if (node.meta.name === "import") moduleSyntax = true;
        break;
      case "AwaitExpression":
      case "ForOfStatement":
        if (node.type === "AwaitExpression" || node.await) {
          let ancestor = parent;
          while (ancestor && !/Function/u.test(ancestor.type))
            ancestor = memberCalls.parents.get(ancestor);
          if (!ancestor) moduleSyntax = true;
        }
        break;
      case "ImportExpression":
        if (node.options || node.phase) unknown = true;
        addSource(node.source, "dynamic");
        break;
      case "TSImportEqualsDeclaration":
        if (node.importKind !== "type") unknown = true;
        return false;
      case "Identifier":
        if (node.name === "arguments" && !staticPropertyKey(node, parent)) {
          let scope = parent;
          while (
            scope &&
            !["FunctionDeclaration", "FunctionExpression"].includes(scope.type)
          )
            scope = memberCalls.parents.get(scope);
          if (!scope) unknown = true;
        }
        if (
          RUNTIME_NAMESPACES.has(node.name) &&
          !staticPropertyKey(node, parent) &&
          !namespaceUse(node, parent)
        )
          unknown = true;
        if (node.name === "require") {
          if (
            parent?.type === "MemberExpression" &&
            !parent.computed &&
            parent.property === node &&
            memberCalls.allowed.has(parent)
          )
            break;
          commonJsUse = true;
          if (
            parent?.type === "CallExpression" &&
            parent.callee === node &&
            !parent.optional &&
            parent.arguments.length === 1
          ) {
            addSource(parent.arguments[0], "require");
          } else unknown = true;
        }
        if (node.name === "module") {
          commonJsUse = true;
          if (
            !memberCalls.allowed.has(node) &&
            (parent?.type !== "MemberExpression" ||
              parent.object !== node ||
              propertyName(parent) !== "exports")
          )
            unknown = true;
        }
        if (
          ["eval", "createRequire", "getBuiltinModule"].includes(node.name) ||
          (node.name === "Function" &&
            !(
              parent?.type === "MemberExpression" &&
              parent.object === node &&
              propertyName(parent) === "prototype"
            ))
        )
          unknown = true;
        break;
      case "MemberExpression":
        if (runtimeNamespace(node) && !namespaceUse(node, parent))
          unknown = true;
        if (
          !memberCalls.allowed.has(node) &&
          OPAQUE_LOADER_KEYS.has(propertyName(node))
        )
          unknown = true;
        break;
      case "Property":
        if (
          parent?.type === "ObjectPattern" &&
          (propertyName(node) === undefined ||
            OPAQUE_LOADER_KEYS.has(propertyName(node)))
        )
          unknown = true;
        break;
      default:
        break;
    }
  });
  const commonJs =
    !moduleSyntax &&
    !/\.[m][jt]s$/u.test(filename) &&
    (/\.[c][jt]s$/u.test(filename) || owner.type !== "module");
  if (commonJsUse && !commonJs) unknown = true;
  return unknown ? undefined : dependencies;
};

// Each lint context owns the filesystem, parser, resolution and graph caches.
// Re-linting after source/manifests/symlinks change must start a new proof.
export const createLocalModuleProof = (filename) => {
  const manifests = new Map();
  const files = new Map();
  const dependencies = new Map();
  const results = new Map();
  let profiles;

  const packageOwner = (file) => {
    let directory = path.dirname(file);
    for (;;) {
      const manifest = path.join(directory, "package.json");
      if (!manifests.has(manifest)) {
        const value = fs.existsSync(manifest)
          ? JSON.parse(fs.readFileSync(manifest, "utf8"))
          : undefined;
        manifests.set(manifest, value);
      }
      const value = manifests.get(manifest);
      if (value !== undefined)
        return value && typeof value === "object" && !Array.isArray(value)
          ? { root: directory, type: value.type, browser: value.browser }
          : undefined;
      const parent = path.dirname(directory);
      if (
        parent === directory ||
        WORKSPACE_DIRECTORIES.has(path.basename(parent)) ||
        path.basename(directory) === "node_modules"
      )
        return undefined;
      directory = parent;
    }
  };

  const ownership = (file) => {
    if (files.has(file)) return files.get(file);
    if (!fs.statSync(file).isFile()) return undefined;
    const owner = packageOwner(file);
    if (!owner) return undefined;
    const realFile = fs.realpathSync(file);
    const realRoot = fs.realpathSync(owner.root);
    const relative = path.relative(owner.root, file);
    if (
      packageOwner(realFile)?.root !== realRoot ||
      relative !== path.relative(realRoot, realFile) ||
      relative.split(path.sep).includes("node_modules")
    )
      return undefined;
    const result = { ...owner, realRoot, file: realFile };
    files.set(file, result);
    return result;
  };

  const fixedLocalFile = (from, specifier) => {
    if (!RELATIVE_MODULE.test(specifier) || !canonicalSpecifier(specifier))
      return undefined;
    const target = fileURLToPath(new URL(specifier, pathToFileURL(from.file)));
    if (target !== path.resolve(path.dirname(from.file), specifier))
      return undefined;
    const owned = ownership(target);
    return owned?.realRoot === from.realRoot ? owned : undefined;
  };

  const resolutionProfiles = () => {
    profiles ??= [false, true].flatMap((browser) =>
      [undefined, "development", "production"].map((environment) => {
        const resolvers = new Map();
        return {
          browser,
          proven: new Set(),
          resolve(from, specifier, kind) {
            const mode = kind === "require" ? "require" : "import";
            if (!resolvers.has(mode))
              resolvers.set(
                mode,
                new ResolverFactory({
                  conditionNames: [
                    browser ? "browser" : "node",
                    mode,
                    ...(browser && mode === "import" ? ["module"] : []),
                    ...(environment ? [environment] : []),
                  ],
                  mainFields: browser
                    ? [
                        "browser",
                        ...(mode === "import" ? ["module"] : []),
                        "main",
                      ]
                    : ["main"],
                  aliasFields: browser ? ["browser"] : [],
                  extensions: [
                    ".js",
                    ".mjs",
                    ".cjs",
                    ".jsx",
                    ".ts",
                    ".mts",
                    ".cts",
                    ".tsx",
                    ".json",
                    ".css",
                  ],
                  nodePath: false,
                  symlinks: false,
                })
              );
            return resolvers.get(mode).sync(path.dirname(from), specifier);
          },
        };
      })
    );
    return profiles;
  };

  const acyclic = (target, profile, active, initialOwner) => {
    if (active.has(target.file)) return false;
    if (profile.proven.has(target.file)) return true;
    if (!dependencies.has(target.file))
      dependencies.set(target.file, runtimeDependencies(target.file, target));
    const edges = dependencies.get(target.file);
    if (!edges) return false;
    active.add(target.file);
    for (const { specifier, kind } of edges) {
      if (!canonicalSpecifier(specifier)) return false;
      const builtin = isBuiltin(specifier);
      if (builtin) {
        // require(module) exposes loader factories, including destructured and
        // namespace aliases. No created-loader origin/escape proof is inferred.
        if (
          kind === "require" &&
          [
            "module",
            "node:module",
            "process",
            "node:process",
            "vm",
            "node:vm",
          ].includes(specifier)
        )
          return false;
        if (kind === "dynamic") return false;
        if (
          !profile.browser ||
          !target.browser ||
          typeof target.browser !== "object" ||
          !Object.hasOwn(target.browser, specifier)
        )
          continue;
      }
      const relative = RELATIVE_MODULE.test(specifier);
      if (
        kind === "dynamic" &&
        (!relative ||
          !SOURCE_FILE.test(specifier) ||
          !fixedLocalFile(target, specifier))
      )
        return false;
      if (
        !relative &&
        !builtin &&
        !/^(?:@[^/]+\/)?[^./][^:]*$/u.test(specifier)
      )
        return false;
      if (relative) {
        const requested = path.resolve(path.dirname(target.file), specifier);
        const within = path.relative(target.realRoot, requested);
        if (
          within.startsWith(`..${path.sep}`) ||
          within === ".." ||
          path.isAbsolute(within) ||
          within.split(path.sep).includes("node_modules")
        )
          return false;
        if (
          kind !== "require" &&
          target.realRoot === initialOwner.realRoot &&
          !fixedLocalFile(target, specifier)
        )
          return false;
      }
      const resolved = profile.resolve(target.file, specifier, kind);
      if (resolved.error || !resolved.path) return false;
      const dependency = ownership(resolved.path);
      if (
        !dependency ||
        (relative && dependency.realRoot !== target.realRoot) ||
        !acyclic(dependency, profile, active, initialOwner)
      )
        return false;
    }
    active.delete(target.file);
    profile.proven.add(target.file);
    return true;
  };

  return (source) => {
    const specifier = literalSpecifier(source);
    if (
      specifier === undefined ||
      !RELATIVE_MODULE.test(specifier) ||
      !path.isAbsolute(filename)
    )
      return false;
    if (results.has(specifier)) return results.get(specifier);
    let proven = false;
    try {
      const owner = ownership(filename);
      const target = owner && fixedLocalFile(owner, specifier);
      proven = Boolean(
        target &&
        SOURCE_FILE.test(target.file) &&
        resolutionProfiles().every((profile) => {
          const resolved = profile.resolve(owner.file, specifier, "dynamic");
          const entry =
            !resolved.error && resolved.path && ownership(resolved.path);
          return (
            entry &&
            entry.realRoot === owner.realRoot &&
            SOURCE_FILE.test(entry.file) &&
            acyclic(entry, profile, new Set([owner.file]), owner)
          );
        })
      );
    } catch {
      // Missing or unreadable files, invalid metadata and resolver/parser
      // failures cannot establish a closed graph. Preserve the original report.
      proven = false;
    }
    results.set(specifier, proven);
    return proven;
  };
};
