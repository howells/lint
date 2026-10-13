"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = meta;
const Settings_1 = require("../../Settings");
/**
 * Returns the meta object for an ESLint rule.
 * @param options The rule metadata definition.
 * @param options.description The description of the rule.
 * @param options.schema The JSON schema for rule options validation.
 * @param options.ruleName The name of the rule.
 * @param options.type The type of the rule (problem, suggestion, or layout).
 * @returns The meta object for the ESLint rule.
 */
function meta({ description, schema, ruleName, type, deprecated, }) {
    return {
        meta: {
            // TODO: Consider changing default to "suggestion" in a future major release, because most rules are not fixing code issues, but only suggesting best practices.
            type: type || "problem",
            docs: {
                url: (0, Settings_1.ruleDocsUrl)(ruleName),
                description,
                category: "dependencies",
            },
            schema,
            ...(deprecated ? { deprecated } : {}),
        },
    };
}
