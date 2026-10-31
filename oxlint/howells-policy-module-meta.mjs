// Prefer native module-location properties only where the execution context
// establishes their availability. Portable URL resolution stays valid otherwise.

const PATH_MODULES = new Set(["path", "node:path"]);
const URL_MODULES = new Set(["url", "node:url"]);
const FUNCTION_BOUNDARIES = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const unwrap = (node) => {
  while (node?.type === "ParenthesizedExpression") node = node.expression;
  return node;
};

const staticName = (node) =>
  node?.type === "Identifier"
    ? node.name
    : node?.type === "Literal"
      ? node.value
      : undefined;

const isImportMeta = (node) =>
  node?.type === "MetaProperty" &&
  node.meta.name === "import" &&
  node.property.name === "meta";

const metaProperty = (node) => {
  node = unwrap(node);
  return node?.type === "MemberExpression" &&
    !node.computed &&
    !node.optional &&
    isImportMeta(node.object)
    ? staticName(node.property)
    : undefined;
};

const walk = (node, visit) => {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value)
        if (child && typeof child.type === "string" && child.parent === node)
          walk(child, visit);
    } else if (
      value &&
      typeof value.type === "string" &&
      value.parent === node
    ) {
      walk(value, visit);
    }
  }
};

const isWrite = (node) => {
  const parent = node.parent;
  return (
    (parent?.type === "AssignmentExpression" && parent.left === node) ||
    (parent?.type === "UpdateExpression" && parent.argument === node) ||
    (parent?.type === "UnaryExpression" &&
      parent.operator === "delete" &&
      parent.argument === node)
  );
};

// Exact typeof-string tests provide the property contract. Mere presence,
// truthiness, or typeof !== "undefined" does not establish a usable path.
const guardFact = (test, property, truth) => {
  test = unwrap(test);
  if (!test) return undefined;
  if (test.type === "UnaryExpression" && test.operator === "!") {
    return guardFact(test.argument, property, !truth);
  }
  if (
    test.type === "BinaryExpression" &&
    ["===", "!==", "==", "!="].includes(test.operator)
  ) {
    const pairs = [
      [test.left, test.right],
      [test.right, test.left],
    ];
    for (const [checked, value] of pairs) {
      if (
        checked.type !== "UnaryExpression" ||
        checked.operator !== "typeof" ||
        metaProperty(checked.argument) !== property ||
        value.type !== "Literal" ||
        value.value !== "string"
      )
        continue;
      const equal = test.operator === "===" || test.operator === "==";
      return truth === equal;
    }
  }
  if (
    test.type === "LogicalExpression" &&
    (test.operator === "&&" || test.operator === "||")
  ) {
    const left = guardFact(test.left, property, truth);
    const right = guardFact(test.right, property, truth);
    // A true conjunction and a false disjunction establish both operands.
    if (
      (test.operator === "&&" && truth) ||
      (test.operator === "||" && !truth)
    ) {
      if (left === false || right === false) return false;
      if (left === true || right === true) return true;
      return undefined;
    }
    // Otherwise either operand may determine the branch: both must agree.
    return left !== undefined && left === right ? left : undefined;
  }
  return undefined;
};

const supportedInEnclosingBranch = (node, property) => {
  let child = node;
  for (
    let parent = node.parent;
    parent;
    child = parent, parent = parent.parent
  ) {
    // An outer check cannot prove the value at a later function invocation.
    if (FUNCTION_BOUNDARIES.has(parent.type)) return false;
    let fact;
    if (parent.type === "IfStatement") {
      if (child === parent.consequent)
        fact = guardFact(parent.test, property, true);
      else if (child === parent.alternate)
        fact = guardFact(parent.test, property, false);
    } else if (parent.type === "ConditionalExpression") {
      if (child === parent.consequent)
        fact = guardFact(parent.test, property, true);
      else if (child === parent.alternate)
        fact = guardFact(parent.test, property, false);
    } else if (parent.type === "LogicalExpression" && child === parent.right) {
      if (parent.operator === "&&")
        fact = guardFact(parent.left, property, true);
      else if (parent.operator === "||")
        fact = guardFact(parent.left, property, false);
      // Never demand a property from the branch intended to handle its absence.
      if (
        ["??", "||"].includes(parent.operator) &&
        metaProperty(parent.left) === property
      )
        return false;
    }
    if (fact !== undefined) return fact;
  }
  return false;
};

export const createPreferSupportedImportMetaPropertiesRule = (context) => {
  const sourceCode = context.sourceCode;
  const variables = new WeakMap();
  let hasModuleMeta = false;

  const variableFor = (identifier) => {
    if (variables.has(identifier)) return variables.get(identifier);
    for (
      let scope = sourceCode.getScope(identifier);
      scope;
      scope = scope.upper
    ) {
      const variable = scope.set.get(identifier.name);
      if (variable) {
        variables.set(identifier, variable);
        return variable;
      }
    }
    variables.set(identifier, undefined);
    return undefined;
  };

  const isGlobal = (identifier, name) =>
    identifier?.type === "Identifier" &&
    identifier.name === name &&
    (variableFor(identifier)?.defs.length ?? 0) === 0;

  const definitionFor = (identifier) => {
    const variable = variableFor(identifier);
    return variable?.defs.length === 1
      ? { variable, definition: variable.defs[0] }
      : undefined;
  };

  const constantInitializer = (identifier) => {
    const found = definitionFor(identifier);
    if (!found || found.definition.node.type !== "VariableDeclarator")
      return undefined;
    const declaration = found.definition.node;
    if (declaration.parent?.kind !== "const") return undefined;
    // Do not turn a TDZ read (or an unknown deferred initialization order)
    // into a successful native-property read.
    if (declaration.range[1] > identifier.range[0]) return undefined;
    // Ignore mutable aliases even if malformed source writes to a const.
    if (
      found.variable.references.some(
        (reference) => reference.isWrite() && !reference.init
      )
    )
      return undefined;
    return declaration;
  };

  const builtin = (expression, seen = new Set()) => {
    expression = unwrap(expression);
    if (!expression) return undefined;
    if (expression.type === "Identifier") {
      const found = definitionFor(expression);
      if (!found || seen.has(found.variable)) return undefined;
      seen = new Set(seen).add(found.variable);
      const declaration = found.definition.node;
      if (
        [
          "ImportSpecifier",
          "ImportDefaultSpecifier",
          "ImportNamespaceSpecifier",
        ].includes(declaration.type)
      ) {
        const imported = declaration.parent;
        const specifier = imported?.source?.value;
        const module = PATH_MODULES.has(specifier)
          ? "path"
          : URL_MODULES.has(specifier)
            ? "url"
            : undefined;
        if (
          !module ||
          imported.importKind === "type" ||
          declaration.importKind === "type"
        )
          return undefined;
        return declaration.type === "ImportSpecifier"
          ? { module, property: staticName(declaration.imported) }
          : { module };
      }
      const constant = constantInitializer(expression);
      if (!constant?.init) return undefined;
      if (constant.id.type === "Identifier")
        return builtin(constant.init, seen);
      if (constant.id.type === "ObjectPattern") {
        const property = constant.id.properties.find(
          (item) =>
            item.type === "Property" &&
            !item.computed &&
            item.value.type === "Identifier" &&
            item.value.name === expression.name
        );
        if (!property) return undefined;
        const module = builtin(constant.init, seen);
        return module && !module.property
          ? { ...module, property: staticName(property.key) }
          : undefined;
      }
      return undefined;
    }
    if (
      expression.type === "MemberExpression" &&
      !expression.computed &&
      !expression.optional
    ) {
      const module = builtin(expression.object, seen);
      return module && !module.property
        ? { ...module, property: staticName(expression.property) }
        : undefined;
    }
    if (
      expression.type === "CallExpression" &&
      !expression.optional &&
      expression.arguments.length === 1 &&
      expression.callee.type === "MemberExpression" &&
      !expression.callee.computed &&
      !expression.callee.optional &&
      staticName(expression.callee.property) === "getBuiltinModule" &&
      isGlobal(expression.callee.object, "process")
    ) {
      const name =
        expression.arguments[0]?.type === "Literal"
          ? expression.arguments[0].value
          : undefined;
      return PATH_MODULES.has(name)
        ? { module: "path" }
        : URL_MODULES.has(name)
          ? { module: "url" }
          : undefined;
    }
    return undefined;
  };

  const isBuiltinCall = (node, module, property) => {
    if (
      node?.type !== "CallExpression" ||
      node.optional ||
      node.arguments.length !== 1 ||
      node.arguments[0].type === "SpreadElement"
    )
      return false;
    const resolved = builtin(node.callee);
    return resolved?.module === module && resolved.property === property;
  };

  const isFileUrl = (node) => {
    node = unwrap(node);
    if (metaProperty(node) === "url") return true;
    return (
      node?.type === "NewExpression" &&
      isGlobal(node.callee, "URL") &&
      node.arguments.length === 1 &&
      metaProperty(node.arguments[0]) === "url"
    );
  };

  const filenameSource = (node, seen = new Set()) => {
    node = unwrap(node);
    if (metaProperty(node) === "filename") return "native";
    if (isBuiltinCall(node, "url", "fileURLToPath"))
      return isFileUrl(node.arguments[0]) ? "portable" : undefined;
    if (node?.type !== "Identifier") return undefined;
    const found = definitionFor(node);
    if (!found || seen.has(found.variable)) return undefined;
    const declaration = constantInitializer(node);
    return declaration?.id.type === "Identifier" && declaration.init
      ? filenameSource(declaration.init, new Set(seen).add(found.variable))
      : undefined;
  };

  const hasMutationHazard = (nodes) =>
    nodes.some((node) => {
      if (isImportMeta(node)) {
        const parent = node.parent;
        // Escape through a variable, argument, return or export prevents a local
        // check from proving that another function cannot change the object.
        return (
          parent?.type !== "MemberExpression" ||
          parent.object !== node ||
          isWrite(parent)
        );
      }
      if (node.type === "CallExpression" && isGlobal(node.callee, "eval"))
        return true;
      if (node.type === "CallExpression") {
        const resolved = builtin(node);
        if (resolved && !resolved.property) {
          const parent = node.parent;
          if (parent?.type === "MemberExpression" && parent.object === node)
            return false;
          if (
            parent?.type === "VariableDeclarator" &&
            parent.init === node &&
            parent.parent.kind === "const"
          )
            return false;
          return true;
        }
      }
      if (
        node.type === "Identifier" &&
        isWrite(node) &&
        (isGlobal(node, "URL") || isGlobal(node, "process"))
      )
        return true;
      if (node.type === "MemberExpression" && isWrite(node)) {
        const resolved = builtin(node.object);
        if (resolved && !resolved.property) return true;
        if (
          isGlobal(node.object, "process") &&
          staticName(node.property) === "getBuiltinModule"
        )
          return true;
        if (
          isGlobal(node.object, "globalThis") &&
          ["URL", "process"].includes(staticName(node.property))
        )
          return true;
      }
      // Catch mutation through an escaped imported module object/constant alias.
      if (node.type === "Identifier") {
        const resolved = builtin(node);
        if (!resolved || resolved.property) return false;
        const parent = node.parent;
        if (
          ["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(
            parent?.type
          )
        )
          return false;
        if (parent?.type === "MemberExpression" && parent.object === node)
          return false;
        if (
          parent?.type === "VariableDeclarator" &&
          parent.init === node &&
          parent.parent.kind === "const"
        )
          return false;
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id === node &&
          parent.parent.kind === "const"
        )
          return false;
        return true;
      }
      return false;
    });

  return {
    MetaProperty(node) {
      hasModuleMeta ||= isImportMeta(node);
    },
    "Program:exit"(program) {
      // Ordinary files need neither an extra tree walk nor a scope manager.
      if (!hasModuleMeta) return;
      const nodes = [];
      walk(program, (node) => nodes.push(node));
      if (hasMutationHazard(nodes)) return;

      const candidates = [];
      for (const node of nodes) {
        if (node.type !== "CallExpression") continue;
        let property;
        if (isBuiltinCall(node, "path", "dirname")) {
          const source = filenameSource(node.arguments[0]);
          // A dirname guard does not by itself make an independently used
          // native filename available; do not erase that possible failure.
          if (
            source &&
            (source !== "native" ||
              supportedInEnclosingBranch(node, "filename"))
          )
            property = "dirname";
        } else if (
          isBuiltinCall(node, "url", "fileURLToPath") &&
          isFileUrl(node.arguments[0])
        )
          property = "filename";
        if (property && supportedInEnclosingBranch(node, property))
          candidates.push({ node, property });
      }
      candidates.sort(
        (left, right) =>
          left.node.range[0] - right.node.range[0] ||
          right.node.range[1] - left.node.range[1]
      );
      const emitted = [];
      for (const { node, property } of candidates) {
        if (
          emitted.some(
            (parent) =>
              parent.range[0] <= node.range[0] &&
              parent.range[1] >= node.range[1]
          )
        )
          continue;
        const comments = sourceCode
          .getAllComments()
          .some(
            (comment) =>
              comment.range[0] >= node.range[0] &&
              comment.range[1] <= node.range[1]
          );
        context.report({
          node,
          message: `Use import.meta.${property}; the enclosing branch establishes that this native path property is available.`,
          ...(comments
            ? {}
            : {
                fix: (fixer) =>
                  fixer.replaceText(node, `import.meta.${property}`),
              }),
        });
        emitted.push(node);
      }
    },
  };
};
