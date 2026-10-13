"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getNoIgnoredDependenciesRule;
const Debug_1 = require("../Debug");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Support_1 = require("./Support");
/**
 * Returns the `no-ignored-dependencies` rule, which prevents recognized elements from
 * importing ignored files.
 *
 * @param ruleName - Rule name to build the rule for. Defaults to the canonical name.
 *   When the deprecated `no-ignored` name is used, a one-time rename warning is emitted.
 * @returns ESLint rule definition.
 */
function getNoIgnoredDependenciesRule(ruleName = Shared_1.RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES) {
    return (0, Support_1.dependencyRule)({
        schema: [],
        ruleName,
        description: `Prevent dependencies to ignored files from recognized elements`,
        deprecated: ruleName === Shared_1.RULE_NAMES_MAP.NO_IGNORED
            ? (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES)
            : undefined,
    }, function ({ dependency, node, context }) {
        if (ruleName === Shared_1.RULE_NAMES_MAP.NO_IGNORED) {
            (0, Debug_1.warnOnce)(`Rule name "${Shared_1.RULE_NAMES_MAP.NO_IGNORED}" is deprecated. Use "${Shared_1.RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES}" instead.`, (0, Settings_1.migrationToV7GuideLink)("no-ignored-renamed-to-no-ignored-dependencies"));
        }
        if (dependency.to.file.isIgnored) {
            context.report({
                message: `Dependencies to ignored files are not allowed`,
                node: node,
            });
        }
    }, {
        validate: false,
    });
}
