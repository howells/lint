"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elements_1 = require("@boundaries/elements");
const Messages_1 = require("../Messages");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Support_1 = require("./Support");
const { RULE_NO_PRIVATE } = Shared_1.SETTINGS;
/**
 * Builds the user-facing error message for private dependency violations.
 *
 * @param dependency - Described dependency that triggered the violation.
 * @param options - Optional rule options with custom message template.
 * @returns Final error message reported by ESLint.
 */
function errorMessage(dependency, options) {
    if (options?.message) {
        return (0, Messages_1.customErrorMessage)(options.message, dependency);
    }
    const privateParent = dependency.to.element.parents?.[0];
    /* istanbul ignore next - Defensive: This should not happen */
    if (!privateParent) {
        return `Not able to create a message for this violation. Please report this at: ${Shared_1.PLUGIN_ISSUES_URL}`;
    }
    return `Dependency is private of ${(0, Messages_1.elementDescriptionMessage)(privateParent, ["types", "category", "captured"], { singleElement: true })}`;
}
exports.default = (0, Support_1.dependencyRule)({
    ruleName: RULE_NO_PRIVATE,
    description: `Prevent dependencies to private elements`,
    deprecated: (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.DEPENDENCIES),
    schema: [
        {
            type: "object",
            properties: {
                allowUncles: {
                    type: "boolean",
                },
                message: {
                    type: "string",
                },
            },
            additionalProperties: false,
        },
    ],
}, function ({ dependency, node, context, options }) {
    (0, Settings_1.warnMigrationToDependencies)(Shared_1.RULE_NAMES_MAP.NO_PRIVATE);
    if (!dependency.to.element.isIgnored &&
        dependency.to.module.origin === elements_1.ORIGINS_MAP.LOCAL &&
        dependency.to.element.types &&
        dependency.to.element.parents.length &&
        dependency.dependency.relationship.to !==
            elements_1.DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL &&
        dependency.dependency.relationship.to !==
            elements_1.DEPENDENCY_RELATIONSHIPS_MAP.CHILD &&
        dependency.dependency.relationship.to !==
            elements_1.DEPENDENCY_RELATIONSHIPS_MAP.SIBLING &&
        (!options?.allowUncles ||
            dependency.dependency.relationship.to !==
                elements_1.DEPENDENCY_RELATIONSHIPS_MAP.UNCLE)) {
        context.report({
            message: errorMessage(dependency, options),
            node: node,
        });
    }
}, {
    validate: false,
});
