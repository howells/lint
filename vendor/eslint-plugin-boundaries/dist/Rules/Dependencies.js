"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePolicies = evaluatePolicies;
exports.resolveCustomMessage = resolveCustomMessage;
exports.buildErrorMessage = buildErrorMessage;
exports.evaluatePoliciesAndReport = evaluatePoliciesAndReport;
exports.default = getDependencyRule;
const elements_1 = require("@boundaries/elements");
const Debug_1 = require("../Debug");
const Elements_1 = require("../Elements");
const Messages_1 = require("../Messages");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Support_1 = require("./Support");
const normalizedPoliciesMap = new WeakMap();
const normalizeRuleEffect = (rule) => {
    if ((0, Shared_1.isUndefined)(rule)) {
        return rule;
    }
    if ((0, elements_1.isBackwardCompatibleDependencySelector)(rule)) {
        return (0, elements_1.normalizeDependencySelector)(rule);
    }
    return (0, elements_1.normalizeEntitySelector)(rule);
};
const normalizeRuleOptions = (rule) => {
    if (normalizedPoliciesMap.has(rule)) {
        return normalizedPoliciesMap.get(rule);
    }
    const normalizedRule = {
        from: rule.from ? (0, elements_1.normalizeEntitySelector)(rule.from) : undefined,
        to: rule.to ? (0, elements_1.normalizeEntitySelector)(rule.to) : undefined,
        dependency: rule.dependency
            ? (0, elements_1.normalizeDependencyInfoSelector)(rule.dependency)
            : undefined,
        importKind: rule.importKind,
        allow: normalizeRuleEffect(rule.allow),
        disallow: normalizeRuleEffect(rule.disallow),
    };
    const precomputedAllow = normalizedRule.allow?.map((entry) => buildEntrySelector(normalizedRule.from, normalizedRule.to, normalizedRule.dependency, entry, rule.importKind /* legacy importKind for backward compatibility */));
    const precomputedDisallow = normalizedRule.disallow?.map((entry) => buildEntrySelector(normalizedRule.from, normalizedRule.to, normalizedRule.dependency, entry, rule.importKind /* legacy importKind for backward compatibility */));
    const precomputedRule = {
        ...normalizedRule,
        precomputedAllow,
        precomputedDisallow,
    };
    normalizedPoliciesMap.set(rule, precomputedRule);
    return precomputedRule;
};
function mergeImportKind(dependencySelector, importKind) {
    if (!importKind) {
        return dependencySelector;
    }
    if (dependencySelector?.dependency) {
        return {
            ...dependencySelector,
            dependency: dependencySelector.dependency.map((dep) => ({
                kind: importKind,
                ...dep,
            })),
        };
    }
    return {
        ...dependencySelector,
        dependency: [
            {
                kind: importKind,
            },
        ],
    };
}
/**
 * Merges two objects by combining their properties, with entry properties taking precedence over outer properties.
 * If both objects have a property that is also an object, they are merged to avoid losing any nested properties.
 * @param outer The outer object.
 * @param entry The entry object.
 * @returns The merged object.
 */
function mergeProperties(outer, entry) {
    if ((0, Shared_1.isObject)(outer) && (0, Shared_1.isObject)(entry)) {
        return { ...outer, ...entry };
    }
    return (0, Shared_1.isUndefined)(entry) ? outer : entry;
}
function mergeElementSingleSelector(outer, entry) {
    /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
    if (!entry) {
        return outer;
    }
    /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
    if (!outer) {
        return entry;
    }
    const result = mergeProperties(outer, entry);
    if (result && (0, Shared_1.isObject)(outer.captured) && (0, Shared_1.isObject)(entry.captured)) {
        result.captured = { ...outer.captured, ...entry.captured };
    }
    const parent = mergeParentSelector(outer.parent, entry.parent);
    if (result && parent) {
        result.parent = parent;
    }
    return result;
}
function mergeParentSingleSelector(outer, entry) {
    /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
    if (!entry) {
        return outer;
    }
    /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
    if (!outer) {
        return entry;
    }
    const result = mergeProperties(outer, entry);
    if (result && (0, Shared_1.isObject)(outer.captured) && (0, Shared_1.isObject)(entry.captured)) {
        result.captured = { ...outer.captured, ...entry.captured };
    }
    return result;
}
function mergeParentSelector(outer, entry) {
    if ((0, Shared_1.isNull)(entry)) {
        return entry;
    }
    if ((0, Shared_1.isNull)(outer)) {
        return (0, Shared_1.isUndefined)(entry) ? outer : entry;
    }
    if (!entry) {
        return outer;
    }
    if (!outer) {
        return entry;
    }
    return outer.flatMap((outerSelector) => {
        return entry.map((entrySelector) => mergeParentSingleSelector(outerSelector, entrySelector));
    });
}
function mergeElementSelector(outer, entry) {
    if (!entry) {
        return outer;
    }
    if (!outer) {
        return entry;
    }
    return outer.flatMap((outerSelector) => {
        return entry.map((entrySelector) => mergeElementSingleSelector(outerSelector, entrySelector));
    });
}
function mergeFileSingleSelector(outer, entry) {
    /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
    if (!entry) {
        return outer;
    }
    /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
    if (!outer) {
        return entry;
    }
    const result = mergeProperties(outer, entry);
    if (result && (0, Shared_1.isObject)(outer.captured) && (0, Shared_1.isObject)(entry.captured)) {
        result.captured = { ...outer.captured, ...entry.captured };
    }
    return result;
}
function mergeFileSelector(outer, entry) {
    if (!entry) {
        return outer;
    }
    if (!outer) {
        return entry;
    }
    return outer.flatMap((outerSelector) => {
        return entry.map((entrySelector) => mergeFileSingleSelector(outerSelector, entrySelector));
    });
}
function mergeModuleSingleSelector(outer, entry) {
    /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
    if (!entry) {
        return outer;
    }
    /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
    if (!outer) {
        return entry;
    }
    return mergeProperties(outer, entry);
}
function mergeModuleSelector(outer, entry) {
    if (!entry) {
        return outer;
    }
    if (!outer) {
        return entry;
    }
    return outer.flatMap((outerSelector) => {
        return entry.map((entrySelector) => mergeModuleSingleSelector(outerSelector, entrySelector));
    });
}
/**
 * Merges two element selectors by merging their fields, with entry fields taking precedence over outer fields.
 * If both selectors have a `captured` field, they are merged separately to avoid losing any captured values.
 */
function mergeEntitySingleSelector(outer, entry) {
    const merged = {};
    const mergedElement = mergeElementSelector(outer.element, entry.element);
    if (mergedElement) {
        merged.element = mergedElement;
    }
    const mergedFile = mergeFileSelector(outer.file, entry.file);
    if (mergedFile) {
        merged.file = mergedFile;
    }
    const mergedModule = mergeModuleSelector(outer.module, entry.module);
    if (mergedModule) {
        merged.module = mergedModule;
    }
    return merged;
}
function mergeDependencyInfoSingleSelector(outer, entry) {
    const result = { ...outer, ...entry };
    const relationship = mergeProperties(outer.relationship, entry.relationship);
    if (!(0, Shared_1.isUndefined)(relationship)) {
        result.relationship = relationship;
    }
    return result;
}
/**
 * Merges the outer selector with the entry selector(s) for a policy, composing the final
 * selector(s) by merging all fields in all combinations.
 * For example, a rule with `to: { type: "helper" }` and an dependency entry with `allow: { to: [{ internalPath: "index.js" }, { internalPath: "foo.js" }] }`,
 * it would produce the merged selectors `[{ to: { type: "helper", internalPath: "index.js" } }, { to: { type: "helper", internalPath: "foo.js" } }]`.
 * @param outerElementSelector The outer selector defined at the rule level.
 * @param entryElementSelector The entry selector(s) defined at the policy level.
 * @returns The merged selector(s) as an array of `BaseElementSelectorData` objects.
 */
function mergeEntitySelector(outerElementSelector, entryElementSelector) {
    if (!entryElementSelector) {
        return outerElementSelector;
    }
    if (!outerElementSelector) {
        return entryElementSelector;
    }
    return outerElementSelector?.flatMap((outerSelector) => {
        return entryElementSelector.map((entrySelector) => mergeEntitySingleSelector(outerSelector, entrySelector));
    });
}
/**
 * Merges the outer dependency selector with the entry dependency selector, composing the final selector by merging all fields in all combinations.
 * For example, a rule with `dependency: { kind: "import" }` and an dependency entry with `allow: { dependency: [{ module: "react" }, { module: "lodash" }] }`,
 * it would produce the merged selectors `[{ dependency: { kind: "import", module: "react" } }, { dependency: { kind: "import", module: "lodash" } }]`.
 * @param outerDependencySelector The outer dependency selector defined at the rule level.
 * @param entryDependencySelector The entry dependency selector(s) defined at the policy level.
 * @returns The merged dependency selector(s) as an array of `DependencyInfoSelectorNormalized` objects.
 */
function mergeDependencyInfoSelectors(outerDependencySelector, entryDependencySelector) {
    if (!entryDependencySelector) {
        return outerDependencySelector;
    }
    if (!outerDependencySelector) {
        return entryDependencySelector;
    }
    return outerDependencySelector.flatMap((outerSelector) => {
        return entryDependencySelector.map((entrySelector) => mergeDependencyInfoSingleSelector(outerSelector, entrySelector));
    });
}
/**
 * Builds the final {@link DependencySelector} by merging the outer rule-level fields
 * (`from`, `to`, `dependency`) with a single policy entry.
 *
 * - **Object entry** — each of `from`, `to` and `dependency` is merged field by field,
 *   with entry fields taking precedence over outer fields. This allows composing criteria:
 *   `{ to: { type: "helper" }, allow: { to: { internalPath: "index.js" } } }` →
 *   selector `{ to: { type: "helper", internalPath: "index.js" } }`.
 * - **Legacy entry** (string or array without objects) — interpreted as the element selector
 *   for the "other" direction (opposite to the direction defined at the rule level).
 */
function buildEntrySelector(outerFrom, outerTo, outerDependency, entry, legacyImportKind) {
    if ((0, elements_1.isDependencySelector)(entry)) {
        const entryObj = entry;
        const mergedFrom = mergeEntitySelector(outerFrom, entryObj.from);
        const mergedTo = mergeEntitySelector(outerTo, entryObj.to);
        const mergedDependency = mergeDependencyInfoSelectors(outerDependency, entryObj.dependency);
        const selectorResult = {};
        if (!(0, Shared_1.isUndefined)(mergedFrom))
            selectorResult.from = mergedFrom;
        if (!(0, Shared_1.isUndefined)(mergedTo))
            selectorResult.to = mergedTo;
        if (!(0, Shared_1.isUndefined)(mergedDependency))
            selectorResult.dependency = mergedDependency;
        return mergeImportKind(selectorResult, legacyImportKind);
    }
    // Legacy entry: string or legacy array → becomes the "other direction" element selector
    // They are not merged because legacy entries are not objects but strings/arrays, so they
    // can not express criteria in the same direction as the outer selector but only in the opposite direction.
    // When neither `from` nor `to` is fixed at the policy level, there is no "other direction"
    // to infer from — `allow`/`disallow` have always scoped the dependency target, so the
    // entry fills `to` (see the v5-to-v6 migration guide's `to` requirement), leaving `from`
    // unconstrained.
    const hasFrom = !(0, Shared_1.isUndefined)(outerFrom);
    const hasTo = !(0, Shared_1.isUndefined)(outerTo);
    const result = {};
    if (hasTo && !hasFrom) {
        result.to = outerTo;
        result.from = [entry];
    }
    else {
        // `@boundaries/elements` treats a present-but-`undefined` property as an invalid
        // selector shape, so `from` is only set when `outerFrom` actually has a value.
        if (hasFrom)
            result.from = outerFrom;
        result.to = [entry];
    }
    return mergeImportKind(result, legacyImportKind);
}
/**
 * Wraps matcher.getDependencySelectorMatchingDescription catching any errors to avoid breaking the rule.
 */
function safeMatch(dep, matcher, selector, extraTemplateData) {
    try {
        return matcher.getDependencySelectorMatchingDescription(dep, selector, {
            extraTemplateData,
        });
    }
    catch (error) /* istanbul ignore next - Defensive check */ {
        (0, Debug_1.warnOnce)(`Error occurred while matching dependency. Please report it at: ${Shared_1.PLUGIN_ISSUES_URL}`, `${JSON.stringify({
            error: (0, Shared_1.isObject)(error)
                ? { message: error.message, stack: error.stack }
                : String(error),
            dependency: dep,
            selector,
            extraTemplateData,
        })}.`);
        return null;
    }
}
/**
 * Iterates precomputed selectors of a policy returning the first match, or null.
 * @param options - The rule options object containing the policy entries and outer selectors.
 * @param options.selectors - Precomputed dependency selectors for the policy.
 * @param options.dep - The dependency description under evaluation.
 * @param options.matcher - The elements matcher instance used to evaluate matches.
 * @param options.templateData - The template data object containing captured values for template rendering.
 * @returns The match result from the first matching selector, or null if no selectors matched.
 */
function evaluateEffectEntries({ selectors, dep, matcher, templateData, }) {
    for (const selector of selectors) {
        const result = safeMatch(dep, matcher, selector, templateData);
        if (result) {
            return result;
        }
    }
    return null;
}
/**
 * Builds template data for legacy `${...}` placeholders from captured values.
 *
 * @param rule - Rule currently being evaluated.
 * @param dep - Dependency description under evaluation.
 * @param legacyTemplates - Whether legacy template mode is enabled.
 * @returns Template data object consumed by matcher template rendering.
 */
function getCapturedTemplateData(rule, dep, legacyTemplates) {
    if (!legacyTemplates)
        return {};
    const targetDir = rule.from ? "from" : "to";
    return targetDir === "from"
        ? {
            ...dep.from.element.captured,
            from: dep.from.element.captured,
            to: dep.to.element.captured,
        }
        : {
            ...dep.to.element.captured,
            from: dep.from.element.captured,
            to: dep.to.element.captured,
        };
}
/**
 * Evaluates the configured rules against a dependency description using a simplified path
 * that delegates all matching entirely to the elements package.
 *
 * For each rule, the outer `from`/`to`/`dependency` fields are merged with each entry in
 * `allow`/`disallow` to build the final {@link DependencySelectorNormalized}. Rules follow
 * **last-write-wins** semantics: the last rule that produces a match determines the outcome.
 * Within a single rule, `disallow`/`deny` takes precedence over `allow` — `allow` is not
 * evaluated when `disallow` already matched.
 */
function evaluatePolicies(rules, dep, matcher, settings) {
    let allowed = null;
    let ruleIndex = null;
    let matchResult = null;
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const templateData = getCapturedTemplateData(rule, dep, settings.legacyTemplates);
        const normalizedRule = normalizeRuleOptions(rule);
        let denyMatched = false;
        if (normalizedRule.precomputedDisallow) {
            const denyMatch = evaluateEffectEntries({
                selectors: normalizedRule.precomputedDisallow,
                dep,
                matcher,
                templateData,
            });
            if (denyMatch) {
                allowed = false;
                ruleIndex = i;
                matchResult = denyMatch;
                denyMatched = true;
            }
        }
        // Allow is only evaluated when disallow/deny did not match for this rule
        if (!denyMatched && normalizedRule.precomputedAllow) {
            const allowMatch = evaluateEffectEntries({
                selectors: normalizedRule.precomputedAllow,
                dep,
                matcher,
                templateData,
            });
            if (allowMatch) {
                allowed = true;
                ruleIndex = i;
                matchResult = allowMatch;
            }
        }
    }
    if (allowed === true)
        return { allowed: true };
    return { allowed: false, ruleIndex, matchResult };
}
/**
 * Resolves the custom error message for a violation, preferring the policy-specific message
 * over the global options message.
 */
function resolveCustomMessage(ruleIndex, ruleOptions) {
    const policyMessage = (0, Shared_1.isNull)(ruleIndex)
        ? undefined
        : (ruleOptions.policies ?? ruleOptions.rules)?.[ruleIndex]?.message;
    return policyMessage ?? ruleOptions.message;
}
/**
 * Builds the error message for a dependency violation.
 */
function buildErrorMessage({ matchResult, ruleIndex, customMessage, dependency, }) {
    if (customMessage) {
        return (0, Messages_1.customErrorMessage)(customMessage, dependency, ruleIndex, matchResult);
    }
    return (0, Messages_1.dependenciesRuleDefaultErrorMessage)(matchResult, ruleIndex, dependency);
}
/**
 * Evaluates configured rules for a dependency and reports ESLint violations.
 *
 * @param params - Rule evaluation context and dependency information.
 */
function evaluatePoliciesAndReport({ rules, dependency, settings, context, node, options, }) {
    const matcher = (0, Elements_1.getElementsMatcher)(settings);
    const result = evaluatePolicies(rules, dependency, matcher, settings);
    const defaultAllowed = options?.default === "allow";
    let finalAllowed = false;
    if (result.allowed === true) {
        finalAllowed = true;
    }
    else if ((0, Shared_1.isNull)(result.ruleIndex)) {
        finalAllowed = defaultAllowed;
    }
    if (!finalAllowed && result.allowed === false) {
        (0, Debug_1.printDependenciesRuleResult)(result.matchResult, result.ruleIndex, dependency, settings, matcher);
        /* istanbul ignore next - Defensive check, should not happen because options are validated */
        const optionsForMessage = options ?? {};
        context.report({
            message: buildErrorMessage({
                matchResult: result.matchResult,
                ruleIndex: result.ruleIndex,
                customMessage: resolveCustomMessage(result.ruleIndex, optionsForMessage),
                dependency,
            }),
            node,
        });
    }
}
/**
 * Returns an ESLint rule definition for the dependencies rule, which checks dependencies between elements based on configured rules.
 * @param customRuleName - Optional custom name for the rule.
 * @returns ESLint rule definition.
 */
function getDependencyRule(ruleName = Shared_1.RULE_NAMES_MAP.DEPENDENCIES) {
    return (0, Support_1.dependencyRule)({
        ruleName,
        description: `Check dependencies between elements`,
        deprecated: ruleName === Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES
            ? (0, Settings_1.deprecatedRuleInfo)(Shared_1.RULE_NAMES_MAP.DEPENDENCIES)
            : undefined,
        schema: (0, Settings_1.rulesOptionsSchema)({
            extraOptionsSchema: {
                checkAllOrigins: {
                    type: "boolean",
                    description: "Whether to check dependencies from all origins (including external and core) or only from local entities. Default to false (only local).",
                },
                checkUnknownLocals: {
                    type: "boolean",
                    description: "Whether to check local dependencies with unknown entities (not matching any entity descriptor) or to ignore them. Default to false (ignore).",
                },
                checkInternals: {
                    type: "boolean",
                    description: "Whether to check internal dependencies (dependencies within files in the same entity). Default to false (ignore).",
                },
            },
        }),
    }, function ({ dependency, node, context, settings, options }) {
        if (ruleName === Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES) {
            (0, Debug_1.warnOnce)(`Rule name "${Shared_1.RULE_NAMES_MAP.ELEMENT_TYPES}" is deprecated. Use "${Shared_1.RULE_NAMES_MAP.DEPENDENCIES}" instead.`, (0, Settings_1.migrationToV6GuideLink)("rule-element-types-renamed-to-dependencies"));
        }
        // Validate and warn about deprecated rule option syntax (legacy
        // selectors, legacy templates, and rule-level importKind).
        (0, Settings_1.validateAndWarnRuleOptions)(options, ruleName, settings.legacyWarnings);
        const checkAllOrigins = options?.checkAllOrigins ?? false;
        const checkUnknownLocals = options?.checkUnknownLocals ?? false;
        const checkInternals = options?.checkInternals ?? false;
        const isLocalDependency = dependency.to.module.origin === elements_1.ORIGINS_MAP.LOCAL;
        const isUnknownLocalDependency = isLocalDependency &&
            dependency.to.file.isUnknown &&
            dependency.to.element.isUnknown;
        const isInternalDependency = dependency.dependency.relationship.to ===
            elements_1.DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL;
        if ((!dependency.to.file.isIgnored || !isLocalDependency) &&
            !dependency.from.file.isIgnored &&
            (checkAllOrigins || isLocalDependency) &&
            (checkUnknownLocals || !isUnknownLocalDependency) &&
            (checkInternals || !isInternalDependency)) {
            const policies = options?.policies ?? options?.rules ?? [];
            evaluatePoliciesAndReport({
                rules: policies,
                settings,
                context,
                node,
                options,
                dependency,
            });
        }
    });
}
