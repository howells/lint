"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependencySource = getDependencySource;
exports.getSpecifiers = getSpecifiers;
exports.entityDescription = entityDescription;
exports.dependencyDescription = dependencyDescription;
const policies_1 = require("@boundaries/policies");
const resolve_1 = __importDefault(require("eslint-module-utils/resolve"));
const Debug_1 = require("../Debug");
const Shared_1 = require("../Shared");
const TYPESCRIPT_ASSERTION_TYPES = new Set([
    "TSAsExpression",
    "TSSatisfiesExpression",
    "TSTypeAssertion",
    "TSNonNullExpression",
]);
/**
 * Returns whether a node is a TypeScript assertion, which asserts the type of an expression without changing its value
 * @param node The node to check
 * @returns True if the node is a TypeScript assertion, false otherwise
 */
function isTypeScriptAssertion(node) {
    return TYPESCRIPT_ASSERTION_TYPES.has(node.type);
}
/**
 * Returns the source of a dependency when it is known without running the code: a string literal or a template literal without substitutions, inside any number of TypeScript assertions
 * @param node The node matched by a dependency node selector
 * @returns The source of the dependency, or a null source that tells whether it is only known at runtime or the node does not define one
 */
function getDependencySource(node) {
    let expression = node;
    while (isTypeScriptAssertion(expression)) {
        expression = expression.expression;
    }
    if (expression.type === "Literal" && (0, Shared_1.isString)(expression.value)) {
        return { source: expression.value };
    }
    if (expression.type === "TemplateLiteral" &&
        expression.expressions.length === 0) {
        const source = expression.quasis[0].value.cooked;
        if ((0, Shared_1.isString)(source)) {
            return { source };
        }
    }
    return {
        source: null,
        runtime: node.type === "TemplateLiteral" || isTypeScriptAssertion(node),
    };
}
/**
 * Returns the specifiers used in an import or export statement
 * @param node The node matched by a dependency node selector
 * @returns The list of specifiers used in the import or export
 */
function getSpecifiers(node) {
    if (node.parent.type === "ImportDeclaration") {
        return node.parent.specifiers
            .filter((specifier) => specifier.type === "ImportSpecifier" &&
            specifier.imported &&
            specifier.imported.name)
            .map((specifier) => specifier.imported.name);
    }
    if (node.parent.type === "ExportNamedDeclaration") {
        return node.parent.specifiers
            .filter((specifier) => specifier.type === "ExportSpecifier" &&
            specifier.exported.name)
            .map((specifier) => specifier.exported.name);
    }
    return [];
}
/**
 * Returns the description of the current entity being linted
 * @param fileName The file name (absolute path)
 * @param settings The ESLint rule context settings normalized
 * @returns The description of the current entity being linted
 */
function entityDescription(fileName, settings) {
    const result = (0, policies_1.describeEntity)(settings, fileName);
    (0, Debug_1.debugDescription)(result, settings, (0, policies_1.getMatcher)(settings));
    return result;
}
/**
 * Returns the description of a dependency node
 * @param options The dependency node info
 * @param options.node The dependency node
 * @param options.source The source of the dependency, as returned by getDependencySource
 * @param options.kind The kind of the dependency
 * @param options.nodeKind The kind of the node generating the dependency
 * @param fileName The file name (absolute path)
 * @param settings The ESLint rule context settings normalized
 * @param context The ESLint rule context
 * @returns The description of the dependency node
 */
function dependencyDescription({ node, source, kind, nodeKind, }, 
/** The file name (absolute path) */
fileName, 
/** The ESLint rule context settings normalized */
settings, 
/** The ESLint rule context */
context) {
    const resolvedPath = (0, resolve_1.default)(source, context);
    const description = (0, policies_1.describeDependency)(settings, {
        from: fileName,
        to: resolvedPath || undefined,
        source,
        kind: kind || "value",
        nodeKind,
        specifiers: getSpecifiers(node),
    });
    (0, Debug_1.debugDescription)(description, settings, (0, policies_1.getMatcher)(settings));
    return description;
}
