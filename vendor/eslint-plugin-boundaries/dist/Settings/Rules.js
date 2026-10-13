"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRulePolicy = void 0;
exports.legacyPoliciesSchema = legacyPoliciesSchema;
exports.rulesOptionsSchema = rulesOptionsSchema;
exports.isRuleEffect = isRuleEffect;
exports.isRuleName = isRuleName;
exports.isRuleShortName = isRuleShortName;
exports.detectLegacyTemplateSyntax = detectLegacyTemplateSyntax;
exports.rulesMainKey = rulesMainKey;
exports.collectRuleWarningIndexes = collectRuleWarningIndexes;
exports.validateAndWarnRuleOptions = validateAndWarnRuleOptions;
exports.warnMigrationToDependencies = warnMigrationToDependencies;
const elements_1 = require("@boundaries/elements");
const Debug_1 = require("../Debug");
const Shared_1 = require("../Shared");
const Settings_types_1 = require("../Shared/Settings.types");
const Docs_1 = require("./Docs");
const trackedWarnedRuleOptions = new WeakSet();
const defaultExtraOptionsSchema = {
    type: "object",
};
/** Schema for validating a micromatch pattern or array of patterns that can also be null. */
const micromatchPatternNullableSchema = {
    anyOf: [
        { type: ["string", "null"] },
        { type: "array", items: { type: ["string", "null"] } },
    ],
};
/** Schema for `atIndex.matches` — a single string pattern or array of string patterns (OR). */
const atIndexMatchesSchema = {
    anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
};
/** A string pattern or an `{ expand }` item. Used in anyOf/allOf/noneOf operands. */
const stringOrExpandItemSchema = {
    anyOf: [
        { type: "string" },
        {
            type: "object",
            properties: { expand: { type: "string" } },
            required: ["expand"],
            additionalProperties: false,
        },
    ],
};
/**
 * Schema for an ArrayQuery over a string array (`categories`, `types`).
 * All operators are optional and AND-combined when present.
 */
const stringArrayQuerySchema = {
    type: "object",
    properties: {
        anyOf: { type: "array", items: stringOrExpandItemSchema },
        allOf: { type: "array", items: stringOrExpandItemSchema },
        noneOf: { type: "array", items: stringOrExpandItemSchema },
        equalsTo: { type: "array", items: stringOrExpandItemSchema },
        atIndex: {
            type: "object",
            properties: {
                index: { type: "number" },
                matches: atIndexMatchesSchema,
            },
            required: ["index", "matches"],
            additionalProperties: false,
        },
        hasLength: { type: "number" },
    },
    additionalProperties: false,
};
/** Schema for a property that accepts either a micromatch pattern or a string array query. */
const micromatchOrArrayQuerySchema = {
    anyOf: [micromatchPatternNullableSchema, stringArrayQuerySchema],
};
const capturedValuesSingleSelectorSchema = {
    type: "object",
    additionalProperties: true,
};
const capturedValuesSelectorSchema = {
    anyOf: [
        {
            type: "null",
        },
        capturedValuesSingleSelectorSchema,
        {
            type: "array",
            items: capturedValuesSingleSelectorSchema,
        },
    ],
};
const parentElementSingleSelectorSchema = {
    type: "object",
    properties: {
        type: micromatchPatternNullableSchema,
        // `types` accepts a micromatch pattern or an array query object.
        // A simplified object schema is used here (no deep validation of the query structure)
        // to avoid generating an overly large AJV validator that crashes V8's baseline JIT
        // when this schema is embedded in parentsArrayQuerySchema five times over.
        types: {
            anyOf: [micromatchPatternNullableSchema, { type: "object" }],
        },
        category: micromatchPatternNullableSchema,
        path: micromatchPatternNullableSchema,
        elementPath: micromatchPatternNullableSchema,
        captured: capturedValuesSelectorSchema,
    },
    additionalProperties: false,
};
const parentElementSelectorSchema = {
    oneOf: [
        { type: "null" },
        parentElementSingleSelectorSchema,
        { type: "array", items: parentElementSingleSelectorSchema },
    ],
};
/** Schema for an ArrayQuery over the parent ancestor chain (`element.parents`).
 * Items use a simplified schema (`{ type: "object" }`) to avoid generating an
 * overly large AJV validator that would crash V8's baseline JIT compiler. */
const parentsArrayQuerySchema = {
    type: "object",
    properties: {
        anyOf: { type: "array", items: { type: "object" } },
        allOf: { type: "array", items: { type: "object" } },
        noneOf: { type: "array", items: { type: "object" } },
        equalsTo: { type: "array", items: { type: "object" } },
        atIndex: {
            type: "object",
            properties: {
                index: { type: "number" },
                matches: {
                    anyOf: [
                        { type: "object" },
                        { type: "array", items: { type: "object" } },
                    ],
                },
            },
            required: ["index", "matches"],
            additionalProperties: false,
        },
        hasLength: { type: "number" },
    },
    additionalProperties: false,
};
const elementSingleSelectorSchema = {
    type: "object",
    properties: {
        path: micromatchPatternNullableSchema,
        elementPath: micromatchPatternNullableSchema,
        internalPath: micromatchPatternNullableSchema,
        elementInternalPath: micromatchPatternNullableSchema,
        fileInternalPath: micromatchPatternNullableSchema,
        type: micromatchPatternNullableSchema,
        types: micromatchOrArrayQuerySchema,
        category: micromatchPatternNullableSchema,
        captured: capturedValuesSelectorSchema,
        parent: parentElementSelectorSchema,
        parents: parentsArrayQuerySchema,
        origin: micromatchPatternNullableSchema,
        isIgnored: { type: "boolean" },
        isUnknown: { type: "boolean" },
    },
    additionalProperties: false,
};
const elementSelectorSchema = {
    oneOf: [
        elementSingleSelectorSchema,
        {
            type: "array",
            items: elementSingleSelectorSchema,
        },
    ],
};
const fileSingleSelectorSchema = {
    type: "object",
    properties: {
        path: micromatchPatternNullableSchema,
        captured: capturedValuesSelectorSchema,
        categories: micromatchOrArrayQuerySchema,
        isIgnored: { type: "boolean" },
        isUnknown: { type: "boolean" },
    },
    additionalProperties: false,
};
const fileSelectorSchema = {
    oneOf: [
        fileSingleSelectorSchema,
        {
            type: "array",
            items: fileSingleSelectorSchema,
        },
    ],
};
const legacyElementSingleSelectorSchema = {
    anyOf: [
        {
            type: "string", // single matcher (legacy)
        },
        {
            type: "array", // matcher with captured values (legacy)
            items: [
                {
                    type: "string", // matcher
                },
                defaultExtraOptionsSchema, // Extra options for legacy rules with custom syntax
            ],
        },
    ],
};
const legacyElementSelectorSchema = {
    anyOf: [
        legacyElementSingleSelectorSchema,
        {
            type: "array",
            items: legacyElementSingleSelectorSchema,
        },
    ],
};
const originSingleSelectorSchema = {
    type: "object",
    properties: {
        module: micromatchPatternNullableSchema,
        kind: micromatchPatternNullableSchema,
    },
    additionalProperties: false,
};
const originSelectorSchema = {
    oneOf: [
        originSingleSelectorSchema,
        {
            type: "array",
            items: originSingleSelectorSchema,
        },
    ],
};
const moduleSingleSelectorSchema = {
    type: "object",
    properties: {
        origin: micromatchPatternNullableSchema,
        source: micromatchPatternNullableSchema,
        internalPath: micromatchPatternNullableSchema,
    },
    additionalProperties: false,
};
const moduleSelectorSchema = {
    oneOf: [
        moduleSingleSelectorSchema,
        {
            type: "array",
            items: moduleSingleSelectorSchema,
        },
    ],
};
const entitySingleSelectorSchema = {
    type: "object",
    properties: {
        element: elementSelectorSchema,
        file: fileSelectorSchema,
        module: moduleSelectorSchema,
        origin: originSelectorSchema,
    },
    additionalProperties: false,
};
const entitySelectorSchema = {
    oneOf: [
        entitySingleSelectorSchema,
        {
            type: "array",
            items: entitySingleSelectorSchema,
        },
    ],
};
const backwardCompatibleEntitySingleSelectorSchema = {
    anyOf: [
        entitySingleSelectorSchema,
        elementSingleSelectorSchema, // Backward compatibility
        legacyElementSelectorSchema,
    ],
};
const backwardCompatibleEntitySelectorSchema = {
    anyOf: [
        entitySelectorSchema,
        backwardCompatibleEntitySingleSelectorSchema,
        {
            type: "array",
            items: backwardCompatibleEntitySingleSelectorSchema,
        },
    ],
};
/**
 * Loose schema for the modern `from`/`to`/`dependency`/`allow`/`disallow` policy properties.
 *
 * Their actual selector shape (element/file/module/origin/dependency-info descriptors) is
 * validated at runtime via the type guards exposed by `@boundaries/elements` (see
 * `validateAndWarnRuleOptions`) instead of a deep AJV schema, which used to be embedded once
 * per property and crashed V8's baseline JIT compiler when parsed.
 */
const modernPolicySelectorSchema = {
    anyOf: [{ type: "object" }, { type: "array" }, { type: "string" }],
};
/**
 * Builds JSON schema for legacy policy selectors.
 *
 * @param matcherOptions - Extra matcher options accepted in legacy tuple syntax.
 * @returns JSON schema definition for legacy policy values.
 */
function legacyPoliciesSchema(matcherOptions = defaultExtraOptionsSchema) {
    return {
        anyOf: [
            {
                type: "string", // single matcher (legacy)
            },
            {
                type: "array", // matcher with captured values (legacy)
                items: [
                    {
                        type: "string", // matcher
                    },
                    matcherOptions, // Extra options for legacy rules with custom syntax
                ],
            },
            {
                type: "array", // multiple matchers
                items: {
                    anyOf: [
                        {
                            type: "string", // matcher (legacy)
                        },
                        {
                            type: "array", // matcher with captured values (legacy)
                            items: [
                                {
                                    type: "string", // matcher
                                },
                                matcherOptions, // Extra options for legacy rules with custom syntax
                            ],
                        },
                    ],
                },
            },
        ],
    };
}
/**
 * Builds JSON schema for rule options of dependency-based rules.
 *
 * @param options - Schema customization options for rule main key and extras.
 * @returns ESLint-compatible schema array for rule options.
 */
function rulesOptionsSchema({ rulesMainKey: mainKey, targetMatcherOptions, extraOptionsSchema, isLegacy = false, } = {}) {
    const policiesSchema = isLegacy
        ? legacyPoliciesSchema(targetMatcherOptions)
        : modernPolicySelectorSchema;
    const legacyMainKey = rulesMainKey(mainKey);
    const ruleSupportedProperties = isLegacy
        ? {
            [legacyMainKey]: backwardCompatibleEntitySelectorSchema,
            allow: policiesSchema,
            disallow: policiesSchema,
        }
        : {
            from: modernPolicySelectorSchema,
            to: modernPolicySelectorSchema,
            dependency: modernPolicySelectorSchema,
            allow: policiesSchema,
            disallow: policiesSchema,
        };
    const requiredProperties = isLegacy
        ? [
            {
                required: [legacyMainKey, "allow"],
            },
            {
                required: [legacyMainKey, "disallow"],
            },
        ]
        : [
            {
                required: ["allow"],
            },
            {
                required: ["disallow"],
            },
            {
                required: ["from", "allow"],
            },
            {
                required: ["from", "disallow"],
            },
            {
                required: ["to", "allow"],
            },
            {
                required: ["to", "disallow"],
            },
            {
                required: ["dependency", "allow"],
            },
            {
                required: ["dependency", "disallow"],
            },
        ];
    const policyEntrySchema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                ...ruleSupportedProperties,
                importKind: {
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
                message: {
                    type: "string",
                },
            },
            additionalProperties: false,
            anyOf: requiredProperties,
        },
    };
    const schema = [
        {
            type: "object",
            properties: {
                message: {
                    type: "string",
                },
                default: {
                    type: "string",
                    enum: ["allow", "disallow"],
                },
                // `policies` is the current option name; `rules` is kept as a deprecated alias.
                policies: policyEntrySchema,
                rules: policyEntrySchema,
                ...extraOptionsSchema,
            },
            additionalProperties: false,
        },
    ];
    // NOTE: The schema is casted because the schema is too complex for TypeScript to infer the type correctly. The schema is valid and can be used with ESLint.
    return schema;
}
/**
 * Type guard to check if a value is a valid RuleEffect.
 * @param value - The value to check.
 * @returns True if the value is a valid RuleEffect, false otherwise.
 */
function isRuleEffect(value) {
    return ((0, Shared_1.isString)(value) &&
        (value === Settings_types_1.RULE_EFFECT_ALLOW || value === Settings_types_1.RULE_EFFECT_DISALLOW));
}
/**
 * Type guard to check if a value is a valid RuleEffect.
 * @deprecated Use `isRuleEffect` instead.
 * @param value - The value to check.
 * @returns True if the value is a valid RuleEffect, false otherwise.
 */
exports.isRulePolicy = isRuleEffect;
/**
 * Type guard to check if a value is a valid rule name including the default plugin prefix.
 * @param value - The value to check.
 * @returns True if the value is a valid rule name with the default plugin prefix, false otherwise.
 */
function isRuleName(value) {
    return Settings_types_1.RULE_NAMES.includes(value);
}
/**
 * Type guard to check if a value is a valid rule short name.
 * @param value - The value to check.
 * @returns True if the value is a valid rule short name, false otherwise.
 */
function isRuleShortName(value) {
    return Settings_types_1.RULE_SHORT_NAMES.includes(value);
}
/**
 * Checks if a string contains legacy template syntax ${...}.
 * @param value - The value to check.
 * @returns True if the value contains legacy template syntax, false otherwise.
 */
function hasLegacyTemplateSyntax(value) {
    return value.includes("${");
}
/**
 * Recursively checks if a selector contains legacy template syntax.
 * @param value - The value to check (can be string, object, array, etc.).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
function checkForLegacyTemplateSyntax(micromatchPattern) {
    if ((0, Shared_1.isString)(micromatchPattern)) {
        return hasLegacyTemplateSyntax(micromatchPattern);
    }
    if ((0, Shared_1.isArray)(micromatchPattern)) {
        return micromatchPattern.some(checkForLegacyTemplateSyntax);
    }
    if ((0, Shared_1.isNull)(micromatchPattern) || !(0, Shared_1.isObject)(micromatchPattern)) {
        return false;
    }
    return Object.values(micromatchPattern).some(checkForLegacyTemplateSyntax);
}
/**
 * Detects if legacy template syntax is used in selectors.
 * @param selector - The selector to check (can be a single selector or an array of selectors).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
function detectLegacyTemplateSyntax(micromatchPattern) {
    return checkForLegacyTemplateSyntax(micromatchPattern);
}
/**
 * Returns the canonical main selector key used by schema and option checks.
 *
 * @param key - Optional rule main key (`from`, `to`, or `target`).
 * @returns The same key with default fallback to `from`.
 */
function rulesMainKey(key = Settings_types_1.FROM) {
    return key;
}
const LEGACY_SELECTOR_KINDS_MAP = {
    STRING: "string",
    TUPLE: "tuple",
    FLAT_ELEMENT: "flat-element",
};
const ALWAYS_SCANNED_SELECTOR_FIELDS = [
    "from",
    "to",
    "target",
    "dependency",
];
const RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW = new Set([
    Settings_types_1.RULE_NAMES_MAP.DEPENDENCIES,
    Settings_types_1.RULE_NAMES_MAP.ELEMENT_TYPES,
]);
/**
 * Determines whether a value is a valid `from`/`to` entity selector, in either its
 * modern (`{ element, file, module }`) or backward-compatible legacy shape.
 *
 * @param value - The `from`/`to` property value to check.
 * @returns True if the value is a valid entity selector, false otherwise.
 */
function isValidEntitySelectorValue(value) {
    return (0, elements_1.isEntitySelector)(value) || (0, elements_1.isLegacyEntitySelector)(value);
}
/**
 * Determines whether a value is a valid `dependency` selector.
 *
 * @param value - The `dependency` property value to check.
 * @returns True if the value is a valid dependency information selector, false otherwise.
 */
function isValidDependencyInfoSelectorValue(value) {
    return ((0, elements_1.isDependencyInfoSelector)(value) || (0, elements_1.isLegacyDependencyInfoSelector)(value));
}
/**
 * Determines whether a value is a valid `allow`/`disallow` policy target: either a
 * dependency selector (`{ from, to, dependency }`) or a bare entity selector, kept for
 * backward compatibility, or an array of either.
 *
 * @param value - The `allow`/`disallow` property value to check.
 * @returns True if the value is a valid policy target, false otherwise.
 */
function isValidPolicyTargetValue(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.every(isValidPolicyTargetValue);
    }
    return ((0, elements_1.isDependencySelector)(value) ||
        (0, elements_1.isLegacyDependencySelector)(value) ||
        isValidEntitySelectorValue(value));
}
/** The policy properties checked for a recognized selector shape, in message display order. */
const INVALID_SELECTOR_PROPERTIES = [
    "from",
    "to",
    "dependency",
    "allow",
    "disallow",
];
/**
 * Collects indices of policy entries whose `from`/`to`/`dependency`/`allow`/`disallow`
 * selectors do not match any shape recognized by the `@boundaries/elements` type guards,
 * together with which of those properties were actually invalid across all entries.
 *
 * This replaces the deep AJV schema that used to validate these selector shapes: JSON
 * schema now only checks the pure ESLint option shape (which top-level properties are
 * allowed), while the actual selector structure is validated here at runtime.
 *
 * @param rules - Rule list to inspect.
 * @returns Indices of rule entries with an unrecognized selector shape, and the set of
 * properties found invalid.
 */
function collectRulesWithInvalidSelectors(rules) {
    const indexes = [];
    const properties = new Set();
    for (const [index, rule] of rules.entries()) {
        const ruleRecord = rule;
        const propertyValidity = [
            [
                "from",
                (0, Shared_1.isUndefined)(ruleRecord.from) ||
                    isValidEntitySelectorValue(ruleRecord.from),
            ],
            [
                "to",
                (0, Shared_1.isUndefined)(ruleRecord.to) || isValidEntitySelectorValue(ruleRecord.to),
            ],
            [
                "dependency",
                (0, Shared_1.isUndefined)(ruleRecord.dependency) ||
                    isValidDependencyInfoSelectorValue(ruleRecord.dependency),
            ],
            [
                "allow",
                (0, Shared_1.isUndefined)(ruleRecord.allow) ||
                    isValidPolicyTargetValue(ruleRecord.allow),
            ],
            [
                "disallow",
                (0, Shared_1.isUndefined)(ruleRecord.disallow) ||
                    isValidPolicyTargetValue(ruleRecord.disallow),
            ],
        ];
        let hasInvalidProperty = false;
        for (const [property, isValid] of propertyValidity) {
            if (!isValid) {
                hasInvalidProperty = true;
                properties.add(property);
            }
        }
        if (hasInvalidProperty) {
            indexes.push(index);
        }
    }
    return { indexes, properties };
}
/**
 * Joins property names into a natural-language, single-quoted list (e.g. `'from'`,
 * `'from' and 'to'`, `'from', 'to' and 'allow'`).
 *
 * @param properties - Property names to join, already in display order.
 * @returns The joined, human-readable list.
 */
function joinQuotedPropertyNames(properties) {
    const quoted = properties.map((property) => `'${property}'`);
    const last = quoted.slice(-1).join("");
    const rest = quoted.slice(0, -1);
    return rest.length === 0 ? last : `${rest.join(", ")} and ${last}`;
}
/**
 * Visits the value of each of a rule's selector fields.
 *
 * `allow`/`disallow` are only visited for `dependencies`/`element-types` rules
 * because in other rules those fields hold external library names or file globs
 * that legitimately use string syntax.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be visited.
 * @param visitor - Callback invoked with each defined selector field value.
 */
function forEachRuleSelectorFieldValue(rule, ruleName, visitor) {
    const ruleRecord = rule;
    const fields = RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(ruleName)
        ? [...ALWAYS_SCANNED_SELECTOR_FIELDS, "allow", "disallow"]
        : ALWAYS_SCANNED_SELECTOR_FIELDS;
    for (const field of fields) {
        const value = ruleRecord[field];
        if (!(0, Shared_1.isUndefined)(value)) {
            visitor(value);
        }
    }
}
/**
 * Determines whether any of a rule's selector fields satisfies a predicate.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @param predicate - Predicate evaluated against each selector field value.
 * @returns True if any scanned selector field satisfies the predicate, false otherwise.
 */
function ruleSelectorFieldMatches(rule, ruleName, predicate) {
    let matches = false;
    forEachRuleSelectorFieldValue(rule, ruleName, (value) => {
        if (!matches && predicate(value)) {
            matches = true;
        }
    });
    return matches;
}
const DEPRECATED_V7_ELEMENT_SELECTOR_PROPS = [
    "category",
    "elementPath",
    "filePath",
];
/**
 * Recursively determines whether a value contains any deprecated v7 element
 * selector property (`category`, `elementPath`, `filePath`).
 *
 * @param value - Value to inspect.
 * @returns True if a deprecated v7 selector property was detected, false otherwise.
 */
function hasDeprecatedV7SelectorProp(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.some(hasDeprecatedV7SelectorProp);
    }
    if (!(0, Shared_1.isObject)(value)) {
        return false;
    }
    for (const prop of DEPRECATED_V7_ELEMENT_SELECTOR_PROPS) {
        if (prop in value &&
            !(0, Shared_1.isUndefined)(value[prop])) {
            return true;
        }
    }
    // Do not recurse into `captured` — its keys are capture value names defined by
    // the element pattern (e.g. `captured: { category: "atoms" }`) and must never
    // be treated as deprecated selector properties.
    const record = value;
    return Object.entries(record)
        .filter(([key]) => key !== "captured")
        .map(([, val]) => val)
        .some(hasDeprecatedV7SelectorProp);
}
/**
 * Recursively determines whether a value contains the deprecated `module`
 * property used in dependency info selectors.
 *
 * @param value - Value to inspect.
 * @returns True if a deprecated `module` property was detected, false otherwise.
 */
function hasDeprecatedDependencyModuleProp(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.some(hasDeprecatedDependencyModuleProp);
    }
    if (!(0, Shared_1.isObject)(value)) {
        return false;
    }
    return ("module" in value &&
        !(0, Shared_1.isUndefined)(value["module"]));
}
/**
 * Returns true when a value used in an element-selector context contains
 * the deprecated `internalPath` property (→ `fileInternalPath`).
 *
 * @param value - Element selector or array of element selectors to inspect.
 * @returns True if any element selector object has `internalPath` set.
 */
function elementSelectorHasDeprecatedInternalPath(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.some(elementSelectorHasDeprecatedInternalPath);
    }
    if (!(0, Shared_1.isObject)(value)) {
        return false;
    }
    return ("internalPath" in value &&
        !(0, Shared_1.isUndefined)(value["internalPath"]));
}
/**
 * Context-aware scan for deprecated `internalPath` in entity-selector values.
 *
 * `internalPath` on a flat element selector (legacy v7) is deprecated; use
 * `fileInternalPath` or the `module` sub-selector instead.
 * `internalPath` inside a `module` sub-selector is modern and must NOT be flagged.
 *
 * @param value - Entity selector or array of entity selectors to inspect.
 * @returns True if a deprecated element-level `internalPath` is detected.
 */
function entitySelectorHasDeprecatedInternalPath(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.some(entitySelectorHasDeprecatedInternalPath);
    }
    if (!(0, Shared_1.isObject)(value)) {
        return false;
    }
    const record = value;
    // Flat element selector at entity level (no entity sub-selector keys present).
    const hasEntitySubKey = !(0, Shared_1.isUndefined)(record["element"]) ||
        !(0, Shared_1.isUndefined)(record["file"]) ||
        !(0, Shared_1.isUndefined)(record["module"]);
    if (!hasEntitySubKey) {
        return "internalPath" in record && !(0, Shared_1.isUndefined)(record["internalPath"]);
    }
    // Modern entity selector — only descend into `element`; `module.internalPath` is valid.
    if (!(0, Shared_1.isUndefined)(record["element"])) {
        return elementSelectorHasDeprecatedInternalPath(record["element"]);
    }
    return false;
}
/**
 * Determines whether a rule contains legacy template syntax (`${...}`)
 * in any of its selector fields.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns True if any selector field contains legacy template syntax, false otherwise.
 */
function ruleHasLegacyTemplateSyntax(rule, ruleName) {
    if (ruleSelectorFieldMatches(rule, ruleName, (value) => detectLegacyTemplateSyntax(value))) {
        return true;
    }
    return (0, Shared_1.isString)(rule.message) && detectLegacyTemplateSyntax(rule.message);
}
/**
 * Determines whether a rule contains legacy string/tuple selector syntax, or an element
 * selector used directly as an entity-selector value (e.g. `{ type: "components" }`
 * instead of `{ element: { type: "components" } }`), in any of its selector fields.
 *
 * `isLegacyEntitySelector` already covers both cases: it is true for legacy string/tuple
 * selectors and for bare (backward-compatible) element-selector objects, and false for a
 * properly wrapped modern entity selector.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns True if any selector field uses legacy selector syntax, false otherwise.
 */
function ruleHasLegacySelectorSyntax(rule, ruleName) {
    return ruleSelectorFieldMatches(rule, ruleName, elements_1.isLegacyEntitySelector);
}
/**
 * Recursively collects which legacy selector kinds (string, tuple, or element selector
 * used directly as an entity selector) are present in a selector value.
 *
 * Order matters: a tuple selector is also an array, so it must be checked before generic
 * array recursion; a bare string must be checked before the flat-element check, since
 * `isLegacyEntitySingleSelector` also matches strings.
 *
 * @param value - Selector value to inspect.
 * @param kinds - Set accumulating the legacy kinds found so far.
 */
function collectLegacySelectorKinds(value, kinds) {
    if ((0, Shared_1.isArray)(value) &&
        value.length === 2 &&
        (0, elements_1.isLegacySimpleElementSingleSelectorByTypeWithOptions)(value)) {
        kinds.add(LEGACY_SELECTOR_KINDS_MAP.TUPLE);
        return;
    }
    if ((0, Shared_1.isArray)(value)) {
        for (const item of value) {
            collectLegacySelectorKinds(item, kinds);
        }
        return;
    }
    if ((0, elements_1.isLegacySimpleElementSingleSelectorByType)(value)) {
        kinds.add(LEGACY_SELECTOR_KINDS_MAP.STRING);
        return;
    }
    if ((0, elements_1.isLegacyEntitySingleSelector)(value)) {
        kinds.add(LEGACY_SELECTOR_KINDS_MAP.FLAT_ELEMENT);
    }
}
/**
 * Collects the legacy selector kinds present across all of a rule's selector fields.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns The set of legacy selector kinds detected in the rule.
 */
function ruleLegacySelectorKinds(rule, ruleName) {
    const kinds = new Set();
    forEachRuleSelectorFieldValue(rule, ruleName, (value) => {
        collectLegacySelectorKinds(value, kinds);
    });
    return kinds;
}
/**
 * Determines whether an `allow`/`disallow` entry, or any entry of an array of entries, is a
 * bare entity/dependency-info selector missing the `from`/`to`/`dependency` wrapper required
 * since v6 (e.g. `{ type: "helper" }` or `"helper"` instead of `{ to: { type: "helper" } }`).
 *
 * @param value - The `allow`/`disallow` property value to inspect.
 * @returns True if any entry lacks the wrapper, false otherwise.
 */
function hasUnwrappedPolicyTargetEntry(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.some(hasUnwrappedPolicyTargetEntry);
    }
    return (isValidPolicyTargetValue(value) && !(0, elements_1.isBaseDependencySingleSelector)(value));
}
/**
 * Determines whether a rule's `allow`/`disallow` properties contain an entry missing the
 * `from`/`to`/`dependency` wrapper. Only `allow`/`disallow` are checked, and only for rules
 * that support entity selectors there (`dependencies`, `element-types`) — for other rules
 * those fields hold external library names or file globs, not selectors.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` apply.
 * @returns True if `allow` or `disallow` contains an unwrapped entry, false otherwise.
 */
function ruleHasUnwrappedPolicyTarget(rule, ruleName) {
    if (!RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(ruleName)) {
        return false;
    }
    const ruleRecord = rule;
    for (const field of ["allow", "disallow"]) {
        const value = ruleRecord[field];
        if (!(0, Shared_1.isUndefined)(value) && hasUnwrappedPolicyTargetEntry(value)) {
            return true;
        }
    }
    return false;
}
/**
 * Returns the singular or plural noun used to describe the affected policy count in a
 * warning summary.
 *
 * @param count - Number of policies affected.
 * @returns "policy" when `count` is 1, "policies" otherwise.
 */
function policyNoun(count) {
    return count === 1 ? "policy" : "policies";
}
/**
 * Classifies a single rule's legacy selector kinds into `indexes`, at `index`, including the
 * "unclassified" fallback when the rule has legacy selector syntax that could not be assigned
 * to any specific kind.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @param index - The rule's index within its `policies` array.
 * @param indexes - Accumulator mutated in place with the matched indices.
 */
function pushLegacySelectorKindIndexes(rule, ruleName, index, indexes) {
    if (!ruleHasLegacySelectorSyntax(rule, ruleName)) {
        return;
    }
    const kinds = ruleLegacySelectorKinds(rule, ruleName);
    if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.STRING)) {
        indexes.rulesWithLegacyStringSelector.push(index);
    }
    if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.TUPLE)) {
        indexes.rulesWithLegacyTupleSelector.push(index);
    }
    if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.FLAT_ELEMENT)) {
        indexes.rulesWithLegacyFlatElementSelector.push(index);
    }
    if (kinds.size === 0) {
        indexes.rulesWithUnclassifiedLegacySelector.push(index);
    }
}
/**
 * Determines whether a rule's `dependency` selector uses the deprecated `dependency.module`
 * property.
 *
 * @param rule - Single rule entry to inspect.
 * @returns True if the rule's `dependency` selector uses `dependency.module`, false otherwise.
 */
function ruleHasDeprecatedDependencyModule(rule) {
    const ruleRecord = rule;
    return (!(0, Shared_1.isUndefined)(ruleRecord["dependency"]) &&
        hasDeprecatedDependencyModuleProp(ruleRecord["dependency"]));
}
/**
 * Single-rule deprecation detectors evaluated for every rule, keyed by the
 * {@link RuleWarningIndexes} bucket their matches are collected into.
 */
const RULE_WARNING_DETECTORS = [
    {
        key: "rulesWithUnwrappedPolicyTarget",
        matches: ruleHasUnwrappedPolicyTarget,
    },
    { key: "rulesWithLegacyTemplate", matches: ruleHasLegacyTemplateSyntax },
    {
        key: "rulesWithDeprecatedImportKind",
        matches: (rule) => !(0, Shared_1.isUndefined)(rule.importKind),
    },
    {
        key: "rulesWithDeprecatedV7SelectorProps",
        matches: (rule, ruleName) => ruleSelectorFieldMatches(rule, ruleName, hasDeprecatedV7SelectorProp),
    },
    {
        key: "rulesWithDeprecatedDependencyModule",
        matches: (rule) => ruleHasDeprecatedDependencyModule(rule),
    },
    {
        key: "rulesWithDeprecatedInternalPath",
        matches: (rule, ruleName) => ruleSelectorFieldMatches(rule, ruleName, entitySelectorHasDeprecatedInternalPath),
    },
];
/**
 * Collects indices of rules using deprecated selector/template/importKind syntax.
 *
 * @param rules - Rule list to inspect.
 * @param ruleName - Rule name used to scope `allow`/`disallow` scanning.
 * @returns Rule indices grouped by deprecated syntax type.
 */
function collectRuleWarningIndexes(rules, ruleName) {
    const indexes = {
        rulesWithLegacyStringSelector: [],
        rulesWithLegacyTupleSelector: [],
        rulesWithLegacyFlatElementSelector: [],
        rulesWithUnclassifiedLegacySelector: [],
        rulesWithUnwrappedPolicyTarget: [],
        rulesWithLegacyTemplate: [],
        rulesWithDeprecatedImportKind: [],
        rulesWithDeprecatedV7SelectorProps: [],
        rulesWithDeprecatedDependencyModule: [],
        rulesWithDeprecatedInternalPath: [],
    };
    for (const [index, rule] of rules.entries()) {
        pushLegacySelectorKindIndexes(rule, ruleName, index, indexes);
        for (const { key, matches } of RULE_WARNING_DETECTORS) {
            if (matches(rule, ruleName)) {
                indexes[key].push(index);
            }
        }
    }
    return indexes;
}
/**
 * Warns once, for `dependencies`/`element-types` rules, when one or more policy entries have a
 * `from`/`to`/`dependency`/`allow`/`disallow` value that does not match any shape recognized by
 * the `@boundaries/elements` type guards.
 *
 * @param policies - The rule's `policies` (or `rules`) entries to inspect.
 * @param ruleName - Rule name displayed in the warning message, and used to decide whether this
 * rule supports `allow`/`disallow`.
 */
function warnAboutInvalidSelectorShapes(policies, ruleName) {
    if (!RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(ruleName)) {
        return;
    }
    const { indexes: invalidIndexes, properties: invalidProperties } = collectRulesWithInvalidSelectors(policies);
    if (invalidIndexes.length === 0) {
        return;
    }
    const orderedInvalidProperties = INVALID_SELECTOR_PROPERTIES.filter((property) => invalidProperties.has(property));
    const propertyNoun = orderedInvalidProperties.length === 1 ? "property" : "properties";
    (0, Debug_1.warnOnce)(`[${ruleName}] Detected an unrecognized selector shape in ${invalidIndexes.length} ${policyNoun(invalidIndexes.length)} at indices: ${invalidIndexes.join(", ")}.`, `Check the ${joinQuotedPropertyNames(orderedInvalidProperties)} ${propertyNoun}. ${(0, Docs_1.moreInfoLink)((0, Docs_1.getRuleDocsPath)(ruleName))}`);
}
/**
 * Warns once when the deprecated `rules` option alias is used instead of `policies`, with a
 * different message depending on whether `policies` is also defined (in which case `rules` is
 * ignored entirely).
 *
 * @param options - Rule options possibly containing the deprecated `rules` alias.
 * @param ruleName - Rule name displayed in the warning message.
 */
function warnAboutDeprecatedRulesOption(options, ruleName) {
    if (!options.rules) {
        return;
    }
    if (options.policies) {
        (0, Debug_1.warnOnce)(`[${ruleName}] The 'rules' option is deprecated and will be ignored because 'policies' is also defined.`, `You can safely remove the 'rules' option. ${(0, Docs_1.migrationToV7GuideLink)("rules-option-renamed-to-policies")}`);
    }
    else {
        (0, Debug_1.warnOnce)(`[${ruleName}] The 'rules' option is deprecated.`, `Please use 'policies' instead. ${(0, Docs_1.migrationToV7GuideLink)("rules-option-renamed-to-policies")}`);
    }
}
/**
 * Warns once when deprecated selector/template syntax is detected in policies, and when the
 * deprecated `rules` option alias is used instead of `policies`.
 *
 * @param options - Rule options containing `policies` (or the deprecated `rules` alias) entries.
 * @param ruleName - Rule name displayed in warning messages.
 */
function validateAndWarnRuleOptions(options, ruleName, legacyWarnings) {
    if (!options || trackedWarnedRuleOptions.has(options)) {
        return;
    }
    const policies = options.policies ?? options.rules;
    if (!policies || !(0, Shared_1.isArray)(policies)) {
        return;
    }
    trackedWarnedRuleOptions.add(options);
    warnAboutInvalidSelectorShapes(policies, ruleName);
    if (!legacyWarnings) {
        return;
    }
    warnAboutDeprecatedRulesOption(options, ruleName);
    const ruleWarningIndexes = collectRuleWarningIndexes(policies, ruleName);
    const legacySyntaxWarnings = [
        {
            indexes: ruleWarningIndexes.rulesWithLegacyStringSelector,
            summary: (count, indexList) => `[${ruleName}] Detected legacy string element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Replace "your-type" with an entity selector, e.g. { element: { type: "your-type" } }. ${(0, Docs_1.migrationToV6GuideLink)("object-based-elements-selector-syntax")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithLegacyTupleSelector,
            summary: (count, indexList) => `[${ruleName}] Detected legacy tuple element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Replace ["your-type", { family: "data" }] with { element: { type: "your-type", captured: { family: "data" } } }. ${(0, Docs_1.migrationToV6GuideLink)("object-based-elements-selector-syntax")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithLegacyFlatElementSelector,
            summary: (count, indexList) => `[${ruleName}] Detected element selectors used directly as entity selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Wrap them in an entity selector: use { element: { type: "your-type" } } instead of { type: "your-type" }. ${(0, Docs_1.migrationToV7GuideLink)("entity-selectors")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithUnclassifiedLegacySelector,
            summary: (count, indexList) => `[${ruleName}] Detected legacy selector syntax in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Consider migrating to entity selectors ({ element: { ... } }). ${(0, Docs_1.migrationToV7GuideLink)("entity-selectors")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithUnwrappedPolicyTarget,
            // cspell:ignore allowdisallow -- documentation anchor for the deprecated bare allow/disallow selector
            summary: (count, indexList) => `[${ruleName}] Detected "allow"/"disallow" entries without a "from"/"to" wrapper in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Use allow: [{ to: { element: { type: "your-type" } } }] or [{ from: ... }] instead of a bare element selector. ${(0, Docs_1.migrationToV6GuideLink)("to-property-in-allowdisallow-rules-is-now-required")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithLegacyTemplate,
            summary: (count, indexList) => `[${ruleName}] Detected legacy template syntax \${...} in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Consider migrating to {{...}} syntax. ${(0, Docs_1.migrationToV6GuideLink)("new-template-syntax")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithDeprecatedImportKind,
            summary: (count, indexList) => `[${ruleName}] Detected deprecated rule-level "importKind" in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Use selector-level "dependency.kind" instead. When both are defined, "dependency.kind" takes precedence. ${(0, Docs_1.migrationToV6GuideLink)("rule-level-importkind-is-deprecated")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithDeprecatedV7SelectorProps,
            summary: (count, indexList) => `[${ruleName}] Detected deprecated selector properties (category, elementPath, filePath) in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Rename elementPath → path, filePath → fileInternalPath, and remove category (use file descriptors instead). ${(0, Docs_1.moreInfoSelectorsLink)("deprecated-element-selector-properties")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithDeprecatedDependencyModule,
            // cspell:ignore dependencymodule -- documentation anchor for the deprecated dependency.module property
            summary: (count, indexList) => `[${ruleName}] Detected deprecated "dependency.module" property in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Use "to.module.source" instead. ${(0, Docs_1.migrationToV7GuideLink)("deprecated-dependencymodule")}`,
        },
        {
            indexes: ruleWarningIndexes.rulesWithDeprecatedInternalPath,
            summary: (count, indexList) => `[${ruleName}] Detected deprecated "internalPath" in element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
            detail: `Use "fileInternalPath" for local element paths, or the module sub-selector "internalPath" for external modules. ${(0, Docs_1.moreInfoSelectorsLink)("deprecated-element-selector-properties")}`,
        },
    ];
    for (const { indexes, summary, detail } of legacySyntaxWarnings) {
        if (indexes.length > 0) {
            (0, Debug_1.warnOnce)(summary(indexes.length, indexes.join(", ")), detail);
        }
    }
    if ((0, Shared_1.isString)(options.message) &&
        detectLegacyTemplateSyntax(options.message)) {
        (0, Debug_1.warnOnce)(`[${ruleName}] Detected legacy template syntax \${...} in the rule's general 'message'.`, `Consider migrating to {{...}} syntax. ${(0, Docs_1.migrationToV6GuideLink)("new-template-syntax")}`);
    }
}
/**
 * Warns about the deprecation of a rule and encourages migration to the "dependencies" rule.
 * @param ruleName The name of the deprecated rule.
 */
function warnMigrationToDependencies(ruleName) {
    (0, Debug_1.warnOnce)(`Rule "${ruleName}" is deprecated and will be removed in future versions.`, `Please migrate to the "${Settings_types_1.RULE_NAMES_MAP.DEPENDENCIES}" rule with appropriate selectors. ${(0, Docs_1.moreInfoLink)((0, Docs_1.getRuleDocsPath)(ruleName), 
    // cspell: disable-next-line
    "migration-to-boundariesdependencies")}`);
}
