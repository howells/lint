"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elements_1 = require("@boundaries/elements");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Dependencies_1 = require("./Dependencies");
const Support_1 = require("./Support");
const { RULE_ENTRY_POINT } = Shared_1.SETTINGS;
/**
 * Adapts legacy template placeholders from `target` to `to` notation.
 *
 * @param templates - Legacy templates from policy options.
 * @returns Normalized templates or `undefined` when not provided.
 */
function modifyLegacyTemplates(templates) {
    const templatesArray = Array.isArray(templates) ? templates : [templates];
    return templatesArray.map((template) => template.replaceAll("${target.", "${to."));
}
/**
 * Converts `entry-point` legacy policies to `dependencies` policy shape.
 *
 * @param rules - Entry-point policies as defined by user configuration.
 * @returns Equivalent dependencies policies for shared evaluator.
 */
function transformToDependenciesRules(rules) {
    const newRules = [];
    for (const rule of rules) {
        const newTargets = (0, elements_1.normalizeEntitySelector)(rule.target);
        for (const target of newTargets) {
            newRules.push({
                to: target,
                allow: rule.allow
                    ? {
                        to: {
                            element: {
                                fileInternalPath: modifyLegacyTemplates(rule.allow),
                            },
                        },
                    }
                    : undefined,
                disallow: rule.disallow
                    ? {
                        to: {
                            element: {
                                fileInternalPath: modifyLegacyTemplates(rule.disallow),
                            },
                        },
                    }
                    : undefined,
                importKind: rule.importKind,
                message: rule.message,
            });
        }
    }
    return newRules;
}
exports.default = (0, Support_1.dependencyRule)({
    ruleName: RULE_ENTRY_POINT,
    description: `Check elements entry point`,
    deprecated: (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.DEPENDENCIES),
    schema: (0, Settings_1.rulesOptionsSchema)({
        rulesMainKey: "target",
        isLegacy: true,
    }),
}, function ({ dependency, node, context, settings, options }) {
    (0, Settings_1.warnMigrationToDependencies)(Shared_1.RULE_NAMES_MAP.ENTRY_POINT);
    // Validate and warn about deprecated rule option syntax (legacy
    // selectors, legacy templates, and rule-level importKind).
    (0, Settings_1.validateAndWarnRuleOptions)(options, Shared_1.RULE_NAMES_MAP.ENTRY_POINT, settings.legacyWarnings);
    if (!dependency.to.file.isIgnored &&
        dependency.to.element.types &&
        dependency.dependency.relationship.to !==
            elements_1.DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL) {
        const rules = transformToDependenciesRules(options?.policies ?? options?.rules ?? []);
        (0, Dependencies_1.evaluatePoliciesAndReport)({
            rules,
            settings,
            context,
            node,
            options,
            dependency,
        });
    }
}, {
    validateRules: { onlyMainKey: true, mainKey: "target" },
});
