"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndWarnRuleOptions = validateAndWarnRuleOptions;
exports.getDependenciesRuleOptions = getDependenciesRuleOptions;
exports.warnMigrationToDependencies = warnMigrationToDependencies;
const config_1 = require("@boundaries/config");
const Debug_1 = require("../Debug");
const Shared_1 = require("../Shared");
const trackedWarnedRuleOptions = new WeakSet();
const normalizedDependenciesRuleOptions = new WeakMap();
/**
 * Normalized options of a dependencies rule entry without options.
 */
const DEFAULT_DEPENDENCIES_RULE_OPTIONS = (0, config_1.normalizeDependenciesRuleOptions)(undefined);
/**
 * Prints, once per options object, the problems found in the policies of a rule: unrecognized selector shapes and, when `legacyWarnings` is true, deprecated syntax. ESLint has already validated the options against the rule schema.
 *
 * @param options - Rule options containing `policies` (or the deprecated `rules` alias) entries.
 * @param ruleName - Rule name displayed in warning messages.
 * @param legacyWarnings - Whether to print the deprecated syntax warnings.
 */
function validateAndWarnRuleOptions(options, ruleName, legacyWarnings) {
    if (!options || trackedWarnedRuleOptions.has(options)) {
        return;
    }
    trackedWarnedRuleOptions.add(options);
    (0, Debug_1.warnDiagnostics)((0, config_1.validateRuleOptions)(ruleName, options, { legacyWarnings, schema: false }));
}
/**
 * Returns the normalized options of a dependencies rule entry, cached by options identity.
 *
 * @param options - The options of the rule entry.
 * @returns The normalized options.
 */
function getDependenciesRuleOptions(options) {
    if (!options) {
        return DEFAULT_DEPENDENCIES_RULE_OPTIONS;
    }
    const cachedOptions = normalizedDependenciesRuleOptions.get(options);
    if (cachedOptions) {
        return cachedOptions;
    }
    const normalizedOptions = (0, config_1.normalizeDependenciesRuleOptions)(options);
    normalizedDependenciesRuleOptions.set(options, normalizedOptions);
    return normalizedOptions;
}
/**
 * Warns about the deprecation of a rule and encourages migration to the "dependencies" rule.
 * @param ruleName The name of the deprecated rule.
 */
function warnMigrationToDependencies(ruleName) {
    (0, Debug_1.warnOnce)(`Rule "${ruleName}" is deprecated and will be removed in future versions.`, `Please migrate to the "${Shared_1.RULE_NAMES_MAP.DEPENDENCIES}" rule with appropriate selectors. ${(0, config_1.moreInfoLink)((0, config_1.getRuleDocsPath)(ruleName), 
    // cspell: disable-next-line
    "migration-to-boundariesdependencies")}`);
}
