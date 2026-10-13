"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementsMatcher = getElementsMatcher;
exports.getSpecifiers = getSpecifiers;
exports.entityDescription = entityDescription;
exports.dependencyDescription = dependencyDescription;
const elements_1 = require("@boundaries/elements");
const resolve_1 = __importDefault(require("eslint-module-utils/resolve"));
const Debug_1 = require("../Debug");
const elements = new elements_1.Elements();
/**
 * Memoizes the resolved Matcher by normalized-settings identity. `getSettings` returns the
 * same SettingsNormalized reference for a given config across the whole ESLint run, so this
 * avoids rebuilding the config and re-hashing all descriptors on every visited node.
 */
const matchersBySettings = new WeakMap();
/**
 * Returns the elements matcher based on the ESLint rule context settings already normalized, filtering out invalid descriptors
 * @param settings The ESLint rule context settings normalized
 * @returns The elements matcher
 */
function getElementsMatcher(settings) {
    const cachedMatcher = matchersBySettings.get(settings);
    if (cachedMatcher) {
        return cachedMatcher;
    }
    const elementsMatcher = elements.getMatcher({
        elements: settings.elementDescriptors,
        files: settings.fileDescriptors,
        elementsSingleMatch: settings.elementsSingleMatch,
        filesSingleMatch: settings.filesSingleMatch,
    }, {
        ignorePaths: settings.ignorePaths,
        includePaths: settings.includePaths,
        legacyTemplates: settings.legacyTemplates,
        cache: settings.cache,
        flagAsExternal: settings.flagAsExternal,
        rootPath: settings.rootPath,
    });
    matchersBySettings.set(settings, elementsMatcher);
    return elementsMatcher;
}
/**
 * Returns the specifiers used in an import or export statement
 * @param node The AST node representing the import or export
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
    const matcher = getElementsMatcher(settings);
    const result = matcher.describeEntity(fileName);
    (0, Debug_1.debugDescription)(result, settings, matcher);
    return result;
}
/**
 * Returns the description of a dependency node
 * @param options The dependency node info
 * @param options.node The dependency node
 * @param options.kind The kind of the dependency
 * @param options.nodeKind The kind of the node generating the dependency
 * @param fileName The file name (absolute path)
 * @param settings The ESLint rule context settings normalized
 * @param context The ESLint rule context
 * @returns The description of the dependency node
 */
function dependencyDescription({ node, kind, nodeKind, }, 
/** The file name (absolute path) */
fileName, 
/** The ESLint rule context settings normalized */
settings, 
/** The ESLint rule context */
context) {
    const source = String(node.value);
    const matcher = getElementsMatcher(settings);
    const resolvedPath = (0, resolve_1.default)(source, context);
    const description = matcher.describeDependency({
        from: fileName,
        to: resolvedPath || undefined,
        source,
        kind: kind || "value",
        nodeKind,
        specifiers: getSpecifiers(node),
    });
    (0, Debug_1.debugDescription)(description, settings, matcher);
    return description;
}
