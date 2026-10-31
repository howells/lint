// Prefer native module-location properties only where the execution context
// establishes their availability. Portable URL resolution stays valid otherwise.

const PATH_MODULES = new Set(["path", "node:path"]);
const PATH_SUBPATH_MODULES = new Set([
  "path/posix",
  "node:path/posix",
  "path/win32",
  "node:path/win32",
]);
const URL_MODULES = new Set(["url", "node:url"]);
const PROCESS_MODULES = new Set(["process", "node:process"]);
const LOADER_MODULES = new Set(["module", "node:module"]);
const EVALUATOR_MODULES = new Set(["vm", "node:vm"]);
const EVALUATOR_GLOBALS = new Set(["eval", "Function"]);
const GLOBAL_ALIASES = new Set(["globalThis", "global", "window", "self"]);
const POSSIBLE_WRAPPERS = new Set([
  "ParenthesizedExpression",
  "ChainExpression",
  "TSAsExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSInstantiationExpression",
]);
const FUNCTION_BOUNDARIES = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const unwrap = (node) => {
  while (node?.type === "ParenthesizedExpression") node = node.expression;
  return node;
};

const unwrapPossible = (node) => {
  while (POSSIBLE_WRAPPERS.has(node?.type)) node = node.expression;
  return node;
};

const expressionContext = (node) => {
  let value = node;
  while (
    POSSIBLE_WRAPPERS.has(value.parent?.type) &&
    value.parent.expression === value
  )
    value = value.parent;
  return { value, parent: value.parent };
};

const staticName = (node) =>
  node?.type === "Identifier"
    ? node.name
    : node?.type === "Literal"
      ? node.value
      : undefined;

const memberName = (node) =>
  node.computed &&
  (node.property.type !== "Literal" ||
    typeof node.property.value !== "string" ||
    node.property.regex ||
    node.property.bigint)
    ? undefined
    : staticName(node.property);

const isBindingProperty = (node, allowQuotedComputed = false) =>
  node.type === "Property" &&
  node.value.type === "Identifier" &&
  (!node.computed ||
    (allowQuotedComputed &&
      node.key.type === "Literal" &&
      typeof node.key.value === "string" &&
      !node.key.regex &&
      !node.key.bigint));

const canFollowBinding = (node) =>
  node.type === "Identifier" ||
  (node.type === "ObjectPattern" &&
    node.properties.every((property) => isBindingProperty(property, true)));

const builtinProperty = (resolved, property, includeObjects) => {
  if (!resolved || resolved.property) return undefined;
  if (
    includeObjects &&
    (property === undefined ||
      property === "default" ||
      (resolved.module === "path" && ["posix", "win32"].includes(property)))
  )
    return { module: resolved.module };
  return { ...resolved, property };
};

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
  let target = node;
  for (let parent = target.parent; parent; parent = target.parent) {
    switch (parent.type) {
      case "AssignmentExpression":
      case "ForInStatement":
      case "ForOfStatement":
        return parent.left === target;
      case "UpdateExpression":
        return parent.argument === target;
      case "UnaryExpression":
        return parent.operator === "delete" && parent.argument === target;
      case "Property":
        if (parent.value !== target || parent.parent?.type !== "ObjectPattern")
          return false;
        break;
      case "AssignmentPattern":
        if (parent.left !== target) return false;
        break;
      case "RestElement":
        if (parent.argument !== target) return false;
        break;
      case "ArrayPattern":
      case "ObjectPattern":
        break;
      case "ParenthesizedExpression":
      case "TSAsExpression":
      case "TSTypeAssertion":
      case "TSNonNullExpression":
      case "TSSatisfiesExpression":
        if (parent.expression !== target) return false;
        break;
      default:
        return false;
    }
    target = parent;
  }
  return false;
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

const initializedBeforeReference = (declaration, identifier) => {
  if (declaration.range[1] > identifier.range[0]) return false;
  let statement = declaration.parent;
  if (statement.parent?.type === "ExportNamedDeclaration")
    statement = statement.parent;
  const owner = statement.parent;
  const statements =
    owner?.type === "Program" || owner?.type === "BlockStatement"
      ? owner.body
      : owner?.type === "SwitchCase"
        ? owner.consequent
        : undefined;
  if (!statements) return false;

  let child = identifier;
  for (
    let ancestor = identifier.parent;
    ancestor;
    child = ancestor, ancestor = ancestor.parent
  ) {
    // A later function's text does not establish when it is invoked. Likewise,
    // another switch case can be entered without running this initializer.
    if (FUNCTION_BOUNDARIES.has(ancestor.type)) return false;
    if (ancestor === owner) {
      const initialization = statements.indexOf(statement);
      const reference = statements.indexOf(child);
      return initialization !== -1 && reference >= initialization;
    }
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

  const constantDeclaration = (identifier) => {
    const found = definitionFor(identifier);
    if (!found || found.definition.node.type !== "VariableDeclarator")
      return undefined;
    const declaration = found.definition.node;
    if (declaration.parent?.kind !== "const") return undefined;
    return declaration;
  };

  const constantInitializer = (identifier) => {
    const declaration = constantDeclaration(identifier);
    if (!declaration) return undefined;
    if (!initializedBeforeReference(declaration, identifier)) return undefined;
    // Ignore mutable aliases even if malformed source writes to a const.
    if (
      variableFor(identifier).references.some(
        (reference) => reference.isWrite() && !reference.init
      )
    )
      return undefined;
    return declaration;
  };

  const resolveBuiltin = (
    expression,
    declarationFor,
    includeObjects = false,
    seen = new Set()
  ) => {
    expression = includeObjects
      ? unwrapPossible(expression)
      : unwrap(expression);
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
        const module =
          PATH_MODULES.has(specifier) ||
          (includeObjects && PATH_SUBPATH_MODULES.has(specifier))
            ? "path"
            : URL_MODULES.has(specifier)
              ? "url"
              : PROCESS_MODULES.has(specifier)
                ? "process"
                : includeObjects && LOADER_MODULES.has(specifier)
                  ? "loader"
                  : includeObjects && EVALUATOR_MODULES.has(specifier)
                    ? "evaluator"
                    : undefined;
        if (
          !module ||
          imported.importKind === "type" ||
          declaration.importKind === "type"
        )
          return undefined;
        return declaration.type === "ImportSpecifier"
          ? builtinProperty(
              { module },
              staticName(declaration.imported),
              includeObjects
            )
          : { module };
      }
      const constant = declarationFor(expression);
      if (!constant?.init) return undefined;
      if (constant.id.type === "Identifier")
        return resolveBuiltin(
          constant.init,
          declarationFor,
          includeObjects,
          seen
        );
      if (constant.id.type === "ObjectPattern") {
        const property = constant.id.properties.find(
          (item) =>
            isBindingProperty(item, includeObjects) &&
            item.value.name === expression.name
        );
        if (!property) return undefined;
        const module = resolveBuiltin(
          constant.init,
          declarationFor,
          includeObjects,
          seen
        );
        return builtinProperty(
          module,
          staticName(property.key),
          includeObjects
        );
      }
      return undefined;
    }
    if (
      expression.type === "MemberExpression" &&
      (includeObjects || !expression.computed) &&
      (includeObjects || !expression.optional)
    ) {
      const module = resolveBuiltin(
        expression.object,
        declarationFor,
        includeObjects,
        seen
      );
      return builtinProperty(module, memberName(expression), includeObjects);
    }
    if (
      expression.type === "CallExpression" &&
      (includeObjects || !expression.optional) &&
      expression.arguments.length === 1 &&
      expression.callee.type === "MemberExpression" &&
      !expression.callee.computed &&
      (includeObjects || !expression.callee.optional) &&
      staticName(expression.callee.property) === "getBuiltinModule" &&
      isGlobal(expression.callee.object, "process")
    ) {
      const name =
        expression.arguments[0]?.type === "Literal"
          ? expression.arguments[0].value
          : undefined;
      return PATH_MODULES.has(name) ||
        (includeObjects && PATH_SUBPATH_MODULES.has(name))
        ? { module: "path" }
        : URL_MODULES.has(name)
          ? { module: "url" }
          : PROCESS_MODULES.has(name)
            ? { module: "process" }
            : includeObjects && LOADER_MODULES.has(name)
              ? { module: "loader" }
              : includeObjects && EVALUATOR_MODULES.has(name)
                ? { module: "evaluator" }
                : undefined;
    }
    return undefined;
  };

  const builtin = (expression) =>
    resolveBuiltin(expression, constantInitializer);

  // A possible alias must invalidate mutation/escape proofs even when its
  // initialization cannot be established for a replacement at that reference.
  const possibleBuiltin = (expression) =>
    resolveBuiltin(expression, constantDeclaration, true);

  const runtimeObject = (expression, seen = new Set()) => {
    expression = unwrapPossible(expression);
    if (
      expression?.type === "Identifier" &&
      !sourceCode
        .getScope(expression)
        .references.some(
          (reference) =>
            reference.identifier === expression && reference.isRead()
        )
    )
      return undefined;
    if (expression?.type === "Identifier") {
      const found = definitionFor(expression);
      if (found) {
        if (seen.has(found.variable)) return undefined;
        seen = new Set(seen).add(found.variable);
      }
    }
    const resolved = possibleBuiltin(expression);
    if (resolved?.module === "loader") return "loader";
    if (resolved?.module === "evaluator") return "evaluator";
    if (
      resolved?.module === "process" &&
      (!resolved.property || resolved.property === "default")
    )
      return "process";
    if (resolved?.module === "url" && resolved.property === "URL") return "URL";
    if (
      resolved?.module === "url" &&
      expression?.type === "MemberExpression" &&
      expression.computed &&
      memberName(expression) === undefined
    )
      return "unknown";
    if (
      resolved?.module === "process" &&
      resolved.property === "getBuiltinModule"
    )
      return "lookup";
    if (expression?.type === "Identifier") {
      if (["require", "module"].some((name) => isGlobal(expression, name)))
        return "loader";
      if (
        EVALUATOR_GLOBALS.has(expression.name) &&
        isGlobal(expression, expression.name)
      )
        return "evaluator";
      if (
        GLOBAL_ALIASES.has(expression.name) &&
        isGlobal(expression, expression.name)
      )
        return "globalThis";
      if (["process", "URL"].some((name) => isGlobal(expression, name)))
        return expression.name;
      const declaration = constantDeclaration(expression);
      return declaration?.id.type === "Identifier" && declaration.init
        ? runtimeObject(declaration.init, seen)
        : undefined;
    }
    if (expression?.type === "NewExpression")
      return runtimeObject(expression.callee, seen) === "URL"
        ? "URLInstance"
        : undefined;
    if (expression?.type === "CallExpression")
      return runtimeObject(expression.callee, seen) === "URLParse"
        ? "URLInstance"
        : undefined;
    if (expression?.type !== "MemberExpression") return undefined;
    const owner = runtimeObject(expression.object, seen);
    const property = memberName(expression);
    if (owner === "globalThis") {
      if (GLOBAL_ALIASES.has(property)) return "globalThis";
      if (["process", "URL"].includes(property)) return property;
      if (EVALUATOR_GLOBALS.has(property)) return "evaluator";
      if (["require", "module"].includes(property)) return "loader";
      if (property === undefined) return "unknown";
    }
    if (owner === "process" && property === "getBuiltinModule") return "lookup";
    if (
      (owner === "process" && property === "mainModule") ||
      owner === "loader"
    )
      return "loader";
    if (owner === "URL") {
      if (property === "parse") return "URLParse";
      if (property === "prototype") return "URLPrototype";
      if (property === "__proto__") return "evaluator";
      if (property === undefined) return "unknown";
    }
    if (owner === "URLPrototype") {
      if (property === "constructor") return "URL";
      if (property === "__proto__" || property === undefined) return "unknown";
    }
    if (owner === "URLInstance") {
      if (property === "constructor") return "URL";
      if (property === "__proto__") return "URLPrototype";
      if (property === undefined) return "unknown";
    }
    // A function's constructor is Function, including methods and accessors
    // reached through an otherwise unmodeled value. Unknown computed access
    // can expose the same constructor without spelling its name.
    if (
      property === "constructor" ||
      (expression.computed && property === undefined)
    )
      return "evaluator";
    if (owner === "unknown" || owner === "lookup") return "unknown";
    if (owner === "evaluator") return "evaluator";
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
      if (node.type === "ImportExpression") return true;
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
      const invoked =
        node.type === "CallExpression"
          ? unwrapPossible(node.callee)
          : node.type === "TaggedTemplateExpression"
            ? unwrapPossible(node.tag)
            : undefined;
      if (invoked?.type === "MemberExpression") {
        const receiver = unwrapPossible(invoked.object);
        const resolved = possibleBuiltin(receiver);
        const runtime = runtimeObject(receiver);
        const method = possibleBuiltin(invoked);
        const modeledHelper =
          (method?.module === "path" && method.property === "dirname") ||
          (method?.module === "url" && method.property === "fileURLToPath");
        const modeledRuntime =
          (runtimeObject(invoked) === "lookup" && possibleBuiltin(node)) ||
          runtimeObject(invoked) === "URLParse";
        const stringRead =
          runtime === "URLInstance" &&
          ["toString", "toJSON"].includes(memberName(invoked)) &&
          node.type === "CallExpression" &&
          node.arguments.length === 0;
        const resultParent = expressionContext(node).parent;
        const discardedResult =
          resultParent?.type === "ExpressionStatement" ||
          (resultParent?.type === "UnaryExpression" &&
            ["void", "typeof"].includes(resultParent.operator));
        const descriptorRead =
          ["__lookupGetter__", "__lookupSetter__"].includes(
            memberName(invoked)
          ) &&
          node.type === "CallExpression" &&
          node.arguments.length === 1 &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string" &&
          discardedResult;
        // A method receives its object as `this`. Unknown calls can mutate it,
        // return it (valueOf), or expose it through a new function (bind).
        if (
          (isImportMeta(receiver) || runtime || resolved) &&
          !(
            node.type === "CallExpression" &&
            (modeledHelper || modeledRuntime)
          ) &&
          !stringRead &&
          !descriptorRead
        )
          return true;
      }
      const runtime = runtimeObject(node);
      if (runtime) {
        const { value, parent } = expressionContext(node);
        const propertyRead =
          parent?.type === "MemberExpression" && parent.object === value;
        const construction =
          runtime === "URL" &&
          parent?.type === "NewExpression" &&
          parent.callee === value;
        const lookupCall =
          runtime === "lookup" &&
          parent?.type === "CallExpression" &&
          parent.callee === value &&
          possibleBuiltin(parent);
        const parseCall =
          runtime === "URLParse" &&
          parent?.type === "CallExpression" &&
          parent.callee === value;
        const localInstance =
          runtime === "URLInstance" &&
          parent?.type === "VariableDeclarator" &&
          parent.id.type === "Identifier" &&
          parent.init === value &&
          parent.parent.kind === "const" &&
          parent.parent.parent?.type !== "ExportNamedDeclaration";
        const decodeInstance =
          runtime === "URLInstance" &&
          isBuiltinCall(parent, "url", "fileURLToPath") &&
          parent.arguments[0] === value;
        if (
          !propertyRead &&
          !construction &&
          !lookupCall &&
          !parseCall &&
          !localInstance &&
          !decodeInstance &&
          parent?.type !== "UnaryExpression"
        )
          return true;
      }
      if (
        node.type === "Identifier" &&
        isWrite(node) &&
        (isGlobal(node, "URL") || isGlobal(node, "process"))
      )
        return true;
      if (node.type === "MemberExpression" && isWrite(node)) {
        const resolved = possibleBuiltin(node.object);
        if (resolved && !resolved.property) return true;
        const property = memberName(node);
        const object = runtimeObject(node.object);
        if (["URL", "URLPrototype", "URLInstance", "unknown"].includes(object))
          return true;
        if (
          object === "process" &&
          (property === undefined || property === "getBuiltinModule")
        )
          return true;
        if (
          object === "globalThis" &&
          (property === undefined || ["URL", "process"].includes(property))
        )
          return true;
      }
      // Catch escaping module objects, including known nested builtin objects.
      if (
        ["Identifier", "CallExpression", "MemberExpression"].includes(node.type)
      ) {
        const resolved = possibleBuiltin(node);
        if (!resolved || resolved.property) return false;
        const { value, parent } = expressionContext(node);
        if (
          [
            "ImportSpecifier",
            "ImportDefaultSpecifier",
            "ImportNamespaceSpecifier",
          ].includes(parent?.type)
        )
          return false;
        if (
          node.type === "Identifier" &&
          definitionFor(node)?.definition.name === node
        ) {
          const declaration = constantDeclaration(node);
          if (
            declaration &&
            canFollowBinding(declaration.id) &&
            declaration.parent.parent?.type !== "ExportNamedDeclaration"
          )
            return false;
        }
        if (parent?.type === "MemberExpression" && parent.object === value)
          return false;
        if (parent?.type === "UnaryExpression") return false;
        if (
          parent?.type === "VariableDeclarator" &&
          (parent.init === value || parent.id === value) &&
          canFollowBinding(parent.id) &&
          parent.parent.kind === "const" &&
          parent.parent.parent?.type !== "ExportNamedDeclaration"
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
