// Matcher, exclusions and diagnostic adapted from Oxc's
// unicorn/no_array_method_this_argument.rs at oxlint_v1.86.0:
// https://github.com/oxc-project/oxc/blob/oxlint_v1.86.0/crates/oxc_linter/src/rules/unicorn/no_array_method_this_argument.rs
/*
MIT License

Copyright (c) 2024-present VoidZero Inc. & Contributors
Copyright (c) 2023 Boshen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const ARRAY_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findLast",
  "findIndex",
  "findLastIndex",
  "flatMap",
  "forEach",
  "map",
  "some",
]);
const STREAM_METHODS = new Set([
  "every",
  "filter",
  "find",
  "flatMap",
  "forEach",
  "map",
  "some",
]);
const STREAM_MODULES = new Set(["node:stream", "stream"]);
const IGNORED = new Set([
  "lodash.every",
  "_.every",
  "underscore.every",
  "lodash.filter",
  "_.filter",
  "underscore.filter",
  "Vue.filter",
  "R.filter",
  "lodash.find",
  "_.find",
  "underscore.find",
  "R.find",
  "lodash.findLast",
  "_.findLast",
  "underscore.findLast",
  "R.findLast",
  "lodash.findIndex",
  "_.findIndex",
  "underscore.findIndex",
  "R.findIndex",
  "lodash.findLastIndex",
  "_.findLastIndex",
  "underscore.findLastIndex",
  "R.findLastIndex",
  "lodash.flatMap",
  "_.flatMap",
  "lodash.forEach",
  "_.forEach",
  "React.Children.forEach",
  "Children.forEach",
  "R.forEach",
  "lodash.map",
  "_.map",
  "underscore.map",
  "React.Children.map",
  "Children.map",
  "jQuery.map",
  "$.map",
  "R.map",
  "lodash.some",
  "_.some",
]);
const NON_FUNCTION_TYPES = new Set([
  "ArrayExpression",
  "BinaryExpression",
  "ClassExpression",
  "TemplateLiteral",
  "UnaryExpression",
  "UpdateExpression",
  "AssignmentExpression",
  "AwaitExpression",
  "NewExpression",
  "TaggedTemplateExpression",
  "ThisExpression",
]);
const TRANSPARENT_EXPRESSIONS = new Set([
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSInstantiationExpression",
  "ChainExpression",
]);

const innerExpression = (node) =>
  TRANSPARENT_EXPRESSIONS.has(node?.type)
    ? innerExpression(node.expression)
    : node;

const memberName = (node) => {
  node = innerExpression(node);
  if (node?.type !== "MemberExpression") return undefined;
  if (!node.computed) return node.property.name;
  if (
    node.property.type === "Literal" &&
    typeof node.property.value === "string"
  )
    return node.property.value;
  if (
    node.property.type === "TemplateLiteral" &&
    node.property.expressions.length === 0
  )
    return node.property.quasis[0].value.cooked;
  return undefined;
};

const pathOf = (node) => {
  node = innerExpression(node);
  return node.type === "Identifier"
    ? node.name
    : memberName(node) === undefined || node.computed
      ? ""
      : `${pathOf(node.object)}.${memberName(node)}`;
};

const isNotFunction = (node, nameOf) =>
  NON_FUNCTION_TYPES.has(node.type) ||
  (node.type === "Literal" && typeof node.value !== "boolean") ||
  (node.type === "Identifier" && node.name === "undefined") ||
  (node.type === "CallExpression" && nameOf(node.callee) !== "bind");

const fromConstructor = (node) =>
  node?.type === "CallExpression" &&
  !node.optional &&
  memberName(node.callee) === "from" &&
  !node.callee.optional
    ? node.callee.object
    : undefined;

const isReadableImport = (specifier) =>
  specifier.type === "ImportSpecifier" &&
  (specifier.imported.name ?? specifier.imported.value) === "Readable";

// Only a direct factory invocation consumes a constructor without exposing it.
// Any other reference (including prototype access, aliases and reflection)
// invalidates the proof for all stream imports: they share the same builtin.
const isFactoryReference = (identifier, specifier) => {
  let constructor = identifier;
  if (!isReadableImport(specifier)) {
    if (
      !["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(
        specifier.type
      )
    )
      return false;
    constructor = identifier.parent;
    if (
      constructor?.object !== identifier ||
      memberName(constructor) !== "Readable"
    )
      return false;
  }
  const factory = constructor.parent;
  return (
    factory?.object === constructor &&
    fromConstructor(factory.parent) === constructor
  );
};

export const createNoArrayMethodThisArgumentRule = (context) => {
  const candidates = [];
  const imports = [];
  const prototypeAccesses = [];
  let otherStreamAccess = false;

  const parenthesized = (node) =>
    context.sourceCode.getTokenBefore(node)?.value === "(" &&
    context.sourceCode.getTokenAfter(node)?.value === ")";
  const nativeMemberName = (node) => {
    const member = innerExpression(node);
    return member?.type === "MemberExpression" &&
      member.computed &&
      parenthesized(member.property)
      ? undefined
      : memberName(member);
  };
  const notFunctionArgument = (node) => {
    // Native Oxc retains ParenthesizedExpression here. ESTree drops it, so
    // recover that distinction before applying the upstream callback filter.
    if (parenthesized(node)) return false;
    return isNotFunction(node, nativeMemberName);
  };

  const variableFor = (identifier) => {
    if (identifier?.type !== "Identifier") return undefined;
    for (
      let scope = context.sourceCode.getScope(identifier);
      scope;
      scope = scope.upper
    ) {
      const variable = scope.set.get(identifier.name);
      if (variable) return variable;
    }
    return undefined;
  };

  const importedReadable = (constructor) => {
    const identifier =
      constructor?.type === "Identifier"
        ? constructor
        : memberName(constructor) === "Readable" && !constructor.optional
          ? constructor.object
          : undefined;
    const variable = variableFor(identifier);
    if (variable?.defs.length !== 1) return false;
    const definition = variable.defs[0];
    const specifier = definition.node;
    return (
      definition.type === "ImportBinding" &&
      imports.includes(specifier) &&
      (constructor === identifier
        ? isReadableImport(specifier)
        : ["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(
            specifier.type
          ))
    );
  };

  const report = (node) => context.report({ node, messageId: "thisArg" });
  // These aliases are followed only to invalidate a proof, never to exempt a
  // receiver. A factory result can expose the shared prototype via reflection
  // or .constructor even without a direct Readable.prototype reference.
  const possibleStream = (node, seen = new Set()) => {
    node = innerExpression(node);
    if (!node) return false;
    if (importedReadable(fromConstructor(node))) return true;
    if (node.type === "Identifier") {
      const variable = variableFor(node);
      if (variable?.defs.length !== 1 || seen.has(variable)) return false;
      const definition = variable.defs[0];
      return (
        definition.node.type === "VariableDeclarator" &&
        possibleStream(definition.node.init, new Set(seen).add(variable))
      );
    }
    return (
      node.type === "CallExpression" &&
      ["map", "filter", "flatMap", "drop", "take", "compose"].includes(
        memberName(node.callee)
      ) &&
      possibleStream(innerExpression(node.callee).object, seen)
    );
  };
  const checkReexport = (node) => {
    if (node.exportKind !== "type" && STREAM_MODULES.has(node.source?.value))
      otherStreamAccess = true;
  };

  return {
    ImportDeclaration(node) {
      if (!STREAM_MODULES.has(node.source.value) || node.importKind === "type")
        return;
      imports.push(
        ...node.specifiers.filter(
          (specifier) => specifier.importKind !== "type"
        )
      );
    },
    ImportExpression(node) {
      if (STREAM_MODULES.has(node.source.value)) otherStreamAccess = true;
    },
    ExportAllDeclaration: checkReexport,
    ExportNamedDeclaration: checkReexport,
    MemberExpression(node) {
      if (["constructor", "__proto__"].includes(memberName(node)))
        prototypeAccesses.push(node.object);
    },
    CallExpression(node) {
      const name = memberName(node.callee);
      if (
        ["getPrototypeOf", "setPrototypeOf"].includes(name) ||
        (name === "get" &&
          ["constructor", "__proto__"].includes(node.arguments[1]?.value))
      )
        prototypeAccesses.push(node.arguments[0]);
      if (
        STREAM_MODULES.has(node.arguments[0]?.value) &&
        ((node.callee.type === "Identifier" &&
          node.callee.name === "require") ||
          memberName(node.callee) === "getBuiltinModule")
      )
        otherStreamAccess = true;
      if (node.optional) return;
      const callee = innerExpression(node.callee);
      const method = nativeMemberName(callee);
      if (!ARRAY_METHODS.has(method) && !["from", "fromAsync"].includes(method))
        return;
      const args = node.arguments;
      if (args.some((argument) => argument.type === "SpreadElement")) return;
      const ignored =
        node.callee === callee &&
        !parenthesized(callee) &&
        IGNORED.has(pathOf(callee));
      if (
        ARRAY_METHODS.has(method) &&
        args.length === 2 &&
        !notFunctionArgument(args[0]) &&
        !ignored
      ) {
        if (STREAM_METHODS.has(method) && fromConstructor(callee.object))
          candidates.push(node);
        else report(args[0]);
      }
      if (
        ["from", "fromAsync"].includes(method) &&
        !node.callee.optional &&
        innerExpression(callee.object).type === "Identifier" &&
        innerExpression(callee.object).name === "Array" &&
        args.length === 3 &&
        !notFunctionArgument(args[1])
      )
        report(args[2]);
    },
    "Program:exit"() {
      if (candidates.length === 0) return;
      const unmodified =
        imports.length > 0 &&
        !otherStreamAccess &&
        !prototypeAccesses.some((node) => possibleStream(node)) &&
        imports.every((specifier) => {
          const variable = variableFor(specifier.local);
          return (
            variable?.defs.length === 1 &&
            variable.references.every((reference) =>
              isFactoryReference(reference.identifier, specifier)
            )
          );
        });
      for (const node of candidates) {
        if (
          !unmodified ||
          !importedReadable(
            fromConstructor(innerExpression(node.callee).object)
          )
        )
          report(node.arguments[0]);
      }
    },
  };
};
