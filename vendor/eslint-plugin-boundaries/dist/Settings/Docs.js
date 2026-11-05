"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deprecatedRuleInfo = deprecatedRuleInfo;
const config_1 = require("@boundaries/config");
/**
 * Builds the ESLint `meta.deprecated` info object for a rule replaced by another rule name
 * (e.g. a rename), so editors/tools can surface the deprecation without relying on the
 * runtime `warnOnce` message.
 * @param replacedByRuleName - The rule name that replaces the deprecated one.
 * @returns The `deprecated` metadata object consumed by ESLint's rule `meta`.
 */
function deprecatedRuleInfo(replacedByRuleName) {
    return {
        message: `Use "${replacedByRuleName}" instead.`,
        url: (0, config_1.ruleDocsUrl)(replacedByRuleName),
        replacedBy: [
            {
                rule: {
                    name: replacedByRuleName,
                    url: (0, config_1.ruleDocsUrl)(replacedByRuleName),
                },
            },
        ],
    };
}
