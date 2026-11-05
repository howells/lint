"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePoliciesAndReport = evaluatePoliciesAndReport;
exports.default = getDependencyRule;
const config_1 = require("@boundaries/config");
const policies_1 = require("@boundaries/policies");
const Debug_1 = require("../Debug");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Support_1 = require("./Support");
/**
 * Evaluates the policies of a rule for a dependency and reports a violation to ESLint.
 *
 * @param params - Rule evaluation context and dependency information.
 * @param params.options - Normalized options of the dependencies rule, or the `dependencies` options that a legacy rule translates its options into.
 * @param params.settings - Normalized plugin settings.
 * @param params.context - ESLint rule context, used to report violations.
 * @param params.node - Node of the dependency source, where violations are reported.
 * @param params.dependency - Dependency description.
 */
function evaluatePoliciesAndReport({ options, dependency, settings, context, node, }) {
    const evaluation = (0, policies_1.evaluatePolicies)(settings, options, dependency);
    (0, Debug_1.warnDiagnostics)(evaluation.diagnostics);
    if (!evaluation.allowed) {
        (0, Debug_1.printDependenciesRuleResult)(evaluation.match, evaluation.policyIndex, dependency, settings, (0, policies_1.getMatcher)(settings));
        context.report({
            message: evaluation.message,
            node,
        });
    }
}
/**
 * Returns an ESLint rule definition for the dependencies rule, which checks dependencies between elements based on configured rules.
 * @param ruleName - Optional custom name for the rule.
 * @returns ESLint rule definition.
 */
function getDependencyRule(ruleName = Shared_1.RULE_NAMES_MAP.DEPENDENCIES) {
    return (0, Support_1.dependencyRule)({
        ruleName,
        description: `Check dependencies between elements`,
        deprecated: ruleName === Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES
            ? (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.DEPENDENCIES)
            : undefined,
        schema: (0, config_1.getRuleOptionsSchema)(ruleName),
    }, function ({ dependency, node, context, settings, options }) {
        if (ruleName === Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES) {
            (0, Debug_1.warnOnce)(`Rule name "${Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES}" is deprecated. Use "${Shared_1.RULE_NAMES_MAP.DEPENDENCIES}" instead.`, (0, config_1.migrationToV6GuideLink)("rule-element-types-renamed-to-dependencies"));
        }
        // Validate and warn about deprecated rule option syntax (legacy
        // selectors, legacy templates, and rule-level importKind).
        (0, Settings_1.validateAndWarnRuleOptions)(options, ruleName, settings.legacyWarnings);
        // Policies are normalized only for the dependencies that the rule checks, so an invalid selector does not fail on files whose dependencies are all skipped
        if ((0, policies_1.getDependencySkipReason)(options, dependency) === null) {
            evaluatePoliciesAndReport({
                options: (0, Settings_1.getDependenciesRuleOptions)(options),
                settings,
                context,
                node,
                dependency,
            });
        }
    });
}
