"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elements_1 = require("@boundaries/elements");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Dependencies_1 = require("./Dependencies");
const Support_1 = require("./Support");
const { RULE_EXTERNAL } = Shared_1.SETTINGS;
/**
 * Type guard for external selectors using tuple syntax with options.
 *
 * @param selector - External library selector from rule options.
 * @returns `true` when selector is `[module, options]`.
 */
function isExternalLibrarySelectorWithOptions(selector) {
    return ((0, Shared_1.isArray)(selector) &&
        selector.length === 2 &&
        (0, Shared_1.isString)(selector[0]) &&
        (0, Shared_1.isObject)(selector[1]));
}
/**
 * Strips the leading slash from a path so it matches the normalized `module.internalPath`
 * value exposed by the elements package.
 *
 * @param path The raw path option supplied by the user.
 * @returns The path without a leading slash, or the original value when not a string.
 */
function normalizeInternalPath(path) {
    if ((0, Shared_1.isString)(path) && path.startsWith("/")) {
        return path.slice(1);
    }
    return path;
}
/**
 * Builds a dependency selector from a legacy external selector using tuple syntax with options.
 * @param selector The external library selector in legacy format with options.
 * @returns The corresponding dependency selector compatible with `dependencies` rule evaluator.
 */
function buildSelectorFromLegacySelectorWithOptions(selector) {
    const moduleSelector = selector[0];
    const selectorOptions = selector[1];
    const dependencyInfoSelector = {};
    const moduleSingleSelector = {
        origin: [elements_1.ORIGINS_MAP.EXTERNAL, elements_1.ORIGINS_MAP.CORE],
        source: moduleSelector,
    };
    if (selectorOptions.specifiers) {
        dependencyInfoSelector.specifiers = selectorOptions.specifiers;
    }
    if (selectorOptions.path) {
        moduleSingleSelector.internalPath = (0, Shared_1.isString)(selectorOptions.path)
            ? normalizeInternalPath(selectorOptions.path)
            : selectorOptions.path.map(normalizeInternalPath);
    }
    const result = {
        to: {
            module: moduleSingleSelector,
        },
    };
    if (dependencyInfoSelector.specifiers) {
        result.dependency = dependencyInfoSelector;
    }
    return result;
}
/**
 * Transforms legacy external selectors into dependency selectors.
 *
 * @param selectors - External selector(s) from legacy rule format.
 * @returns Dependency selector(s) compatible with `dependencies` rule evaluator.
 */
function modifySelectors(selectors) {
    const originsToMatch = [elements_1.ORIGINS_MAP.EXTERNAL, elements_1.ORIGINS_MAP.CORE];
    if (isExternalLibrarySelectorWithOptions(selectors)) {
        return buildSelectorFromLegacySelectorWithOptions(selectors);
    }
    if ((0, Shared_1.isString)(selectors)) {
        return {
            to: {
                module: {
                    origin: originsToMatch,
                    source: selectors,
                },
            },
        };
    }
    return selectors.map((selector) => {
        if (isExternalLibrarySelectorWithOptions(selector)) {
            return buildSelectorFromLegacySelectorWithOptions(selector);
        }
        return {
            to: { module: { origin: originsToMatch, source: selector } },
        };
    });
}
/**
 * Converts `external` legacy policies to `dependencies` policy shape.
 *
 * @param rules - External policies as configured by the user.
 * @returns Equivalent dependencies policies consumed by shared evaluator.
 */
function transformToDependenciesRules(rules) {
    return rules.map((rule) => ({
        from: rule.from,
        allow: rule.allow ? modifySelectors(rule.allow) : undefined,
        disallow: rule.disallow ? modifySelectors(rule.disallow) : undefined,
        importKind: rule.importKind,
        message: rule.message,
    }));
}
exports.default = (0, Support_1.dependencyRule)({
    ruleName: RULE_EXTERNAL,
    description: `Check dependencies to external and core libraries`,
    deprecated: (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.DEPENDENCIES),
    schema: (0, Settings_1.rulesOptionsSchema)({
        isLegacy: true,
        targetMatcherOptions: {
            type: "object",
            properties: {
                specifiers: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                },
                path: {
                    anyOf: [
                        {
                            type: "string",
                        },
                        {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                    ],
                },
            },
            additionalProperties: false,
        },
    }),
}, function ({ dependency, node, context, settings, options }) {
    (0, Settings_1.warnMigrationToDependencies)(Shared_1.RULE_NAMES_MAP.EXTERNAL);
    // Validate and warn about deprecated rule option syntax (legacy
    // selectors, legacy templates, and rule-level importKind).
    (0, Settings_1.validateAndWarnRuleOptions)(options, Shared_1.RULE_NAMES_MAP.EXTERNAL, settings.legacyWarnings);
    const origin = dependency.to.module.origin;
    if (origin === elements_1.ORIGINS_MAP.EXTERNAL || origin === elements_1.ORIGINS_MAP.CORE) {
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
    validateRules: { onlyMainKey: true },
});
