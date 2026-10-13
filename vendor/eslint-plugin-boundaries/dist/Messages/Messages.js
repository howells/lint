"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementDescriptionMessage = elementDescriptionMessage;
exports.dependenciesRuleMatchedMessage = dependenciesRuleMatchedMessage;
exports.dependenciesRuleDefaultErrorMessage = dependenciesRuleDefaultErrorMessage;
const Shared_1 = require("../Shared");
const MESSAGE_ERROR = `Not able to create a message for this violation. Please report this at: ${Shared_1.PLUGIN_ISSUES_URL}`;
const NO_RULE_MESSAGE = "There is no policy allowing dependencies";
/**
 * Wraps a value in double quotes.
 * @param value - Value to quote.
 * @returns Quoted string.
 */
function quote(value) {
    return `"${String(value)}"`;
}
/**
 * Joins message parts with commas and a final "and".
 * @param parts - List of message parts to join.
 * @returns Joined message string with proper comma and "and" placement.
 */
function joinWithCommasAndAnd(parts) {
    /* istanbul ignore next -- Defensive: callers always guard against empty array */
    if (parts.length === 0) {
        return "";
    }
    if (parts.length === 1) {
        return parts[0];
    }
    if (parts.length === 2) {
        return `${parts[0]} and ${parts[1]}`;
    }
    return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
/**
 * Converts a primitive or array value to a quoted string representation.
 * @param value - Value to format, which can be a primitive or an array of primitives.
 * @returns Quoted string representation of the value, with arrays joined by commas.
 */
function formatPropertyValue(value) {
    if ((0, Shared_1.isArray)(value)) {
        return value.map((entry) => quote(entry)).join(", ");
    }
    return quote(value);
}
/**
 * Capitalizes the first character of a message.
 * @param message - Message to capitalize.
 * @returns Message with the first character capitalized.
 */
function capitalizeFirstLetter(message) {
    /* istanbul ignore next -- Defensive: capitalizeFirstLetter is always called with non-empty message strings */
    if (!message.length) {
        return message;
    }
    return `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
}
/**
 * Builds message fragments from a selector-driven list of properties.
 * @param elementDescription - Element to describe.
 * @param properties - List of element properties to include in the description.
 * @param options - Additional options for handling specific properties like "captured".
 * @param options.capturedKeys - If "captured" is included in properties, specifies which captured keys to include in the description.
 * @returns List of formatted message fragments describing the element based on the selected properties.
 */
function buildSinglePropertyFragments(elementDescription, propertyName, options, includeNullValues) {
    if (propertyName === "parent") {
        const parentFragment = buildParentFragment(elementDescription, options, includeNullValues);
        return parentFragment ? [parentFragment] : [];
    }
    const value = getElementPropertyValue(elementDescription, propertyName);
    if (propertyName === "captured") {
        return buildCapturedFragments(value, options?.capturedKeys, includeNullValues);
    }
    if (shouldSkipFragmentValue(value, includeNullValues)) {
        return [];
    }
    if (propertyName === "type" || propertyName === "types") {
        const label = (0, Shared_1.isArray)(value) && value.length > 1 ? "types" : "type";
        return [formatPropertyFragment(label, value)];
    }
    return [formatPropertyFragment(propertyName, value)];
}
function buildElementPropertyFragments(elementDescription, properties, options) {
    const includeNullValues = options.includeNullValues;
    const fragments = [];
    for (const propertyName of properties) {
        fragments.push(...buildSinglePropertyFragments(elementDescription, propertyName, options, includeNullValues));
    }
    return fragments;
}
/**
 * Builds a message fragment for the first parent element when requested.
 * @param elementDescription - Element that may include parent information.
 * @param options - Selector-driven options for parent and captured properties.
 * @param includeNullValues - Whether null parent values should be rendered.
 * @returns Parent fragment string, or null when no parent information should be emitted.
 */
function buildParentFragment(elementDescription, options, includeNullValues) {
    const firstParent = elementDescription.parents?.[0];
    if (!firstParent) {
        return includeNullValues ? `parent ${quote(null)}` : null;
    }
    const parentProperties = options?.parentProperties ?? [];
    const parentFragments = buildElementPropertyFragments(firstParent, parentProperties, {
        capturedKeys: options?.parentCapturedKeys,
        includeNullValues,
    });
    if (!parentFragments.length) {
        return null;
    }
    return `parent ${joinWithCommasAndAnd(parentFragments)}`;
}
/**
 * Reads an element property value using a dynamic property name.
 * @param elementDescription - Element metadata source object.
 * @param propertyName - Property name to read.
 * @returns Raw value for the requested property.
 */
function getElementPropertyValue(elementDescription, propertyName) {
    if (propertyName === "type") {
        return elementDescription.types;
    }
    return elementDescription[propertyName];
}
/**
 * Determines whether a property value should be skipped when building fragments.
 * @param value - Property value to evaluate.
 * @param includeNullValues - Whether null values are allowed in output.
 * @returns True when the value should be ignored for message output.
 */
function shouldSkipFragmentValue(value, includeNullValues) {
    return (0, Shared_1.isUndefined)(value) || ((0, Shared_1.isNull)(value) && !includeNullValues);
}
/**
 * Builds captured-property message fragments from selected captured keys.
 * @param value - Captured value container to inspect.
 * @param capturedKeys - Captured keys selected by the selector.
 * @param includeNullValues - Whether empty captured values should render as null.
 * @returns List of captured fragments ready to be joined in a message.
 */
function buildCapturedFragments(value, capturedKeys, includeNullValues) {
    if (!(0, Shared_1.isObject)(value) || Object.keys(value).length === 0) {
        return includeNullValues ? [`captured ${quote(null)}`] : [];
    }
    const entries = [];
    const keys = capturedKeys ?? Object.keys(value);
    for (const capturedKey of keys) {
        const capturedValue = value[capturedKey];
        if ((0, Shared_1.isUndefined)(capturedValue)) {
            continue;
        }
        entries.push(`${capturedKey}=${formatPropertyValue(capturedValue)}`);
    }
    if (!entries.length) {
        return [];
    }
    return [`captured values: ${entries.join(", ")}`];
}
/**
 * Formats a generic property fragment using key and value.
 * @param propertyName - Property name label.
 * @param value - Property value to serialize.
 * @returns Formatted property fragment.
 */
function formatPropertyFragment(propertyName, value) {
    return `${propertyName} ${formatPropertyValue(value)}`;
}
/**
 * Determines whether a dependency property value should be rendered.
 * @param value - Property value to evaluate.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns True when the value should be rendered.
 */
function shouldRenderDependencyValue(value, includeNullValues) {
    return !(0, Shared_1.isUndefined)(value) && (!(0, Shared_1.isNull)(value) || includeNullValues);
}
/**
 * Builds a relationship-side fragment when the selected side should be rendered.
 * @param relationship - Relationship metadata value.
 * @param relationshipKey - Relationship side to describe.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns Formatted relationship fragment, or null when the side should be ignored.
 */
function buildRelationshipFragment(relationship, relationshipKey, includeNullValues) {
    const relationshipValue = relationship[relationshipKey];
    if (!shouldRenderDependencyValue(relationshipValue, includeNullValues)) {
        return null;
    }
    return `relationship ${relationshipKey} ${formatPropertyValue(relationshipValue)}`;
}
/**
 * Builds message fragments for selected relationship sides.
 * @param relationship - Relationship metadata value.
 * @param relationshipKeys - Relationship sides to include.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns List of relationship fragments.
 */
function buildRelationshipFragments(relationship, relationshipKeys, includeNullValues) {
    const fragments = [];
    for (const relationshipKey of /* istanbul ignore next -- Defensive: callers always derive relationshipKeys from the selector */ relationshipKeys ?? [
        "from",
        "to",
    ]) {
        const fragment = buildRelationshipFragment(relationship, relationshipKey, includeNullValues);
        if (fragment) {
            fragments.push(fragment);
        }
    }
    return fragments;
}
/**
 * Describes elements using the selected relevant properties.
 * @param elementDescription - Element to describe.
 * @param properties - List of element properties to include in the description.
 * @param options - Additional options for message formatting.
 * @param options.singleElement - If `true`, uses singular "element" label instead of "elements of".
 * @returns Formatted message describing the element based on the selected properties.
 */
function elementDescriptionMessage(elementDescription, properties, { singleElement = false, includeNullValues = false, } = {}) {
    const propertyFragments = buildElementPropertyFragments(elementDescription, properties, {
        includeNullValues,
    });
    if (!propertyFragments.length) {
        return "";
    }
    const elementLabel = singleElement ? "element" : "elements";
    return `${elementLabel} of ${joinWithCommasAndAnd(propertyFragments)}`;
}
/**
 * Describes elements using selector-driven relevant properties and captured keys.
 * @param elementDescription - Element to describe.
 * @param selectorData - Selector data that determines which properties and captured keys to include in the description.
 */
function elementDescriptionMessageFromSelector(elementDescription, selectorData) {
    if (!selectorData) {
        return null;
    }
    const properties = Object.keys(selectorData);
    if (!properties.length) {
        return null;
    }
    const capturedKeys = (0, Shared_1.isObject)(selectorData.captured)
        ? Object.keys(selectorData.captured)
        : undefined;
    const parentProperties = (0, Shared_1.isObject)(selectorData.parent)
        ? Object.keys(selectorData.parent)
        : undefined;
    const parentCapturedKeys = (0, Shared_1.isObject)(selectorData.parent) && (0, Shared_1.isObject)(selectorData.parent.captured)
        ? Object.keys(selectorData.parent.captured)
        : undefined;
    const propertyFragments = buildElementPropertyFragments(elementDescription, properties, {
        capturedKeys,
        parentProperties,
        parentCapturedKeys,
        includeNullValues: true,
    });
    if (!propertyFragments.length) {
        return null;
    }
    return `elements of ${joinWithCommasAndAnd(propertyFragments)}`;
}
/**
 * Builds message fragments from a selector-driven list of file properties.
 * @param fileDescription - File to describe.
 * @param properties - List of file properties to include in the description.
 * @param options - Additional options for handling specific properties like "captured".
 * @returns List of formatted fragments describing the file.
 */
function buildFilePropertyFragments(fileDescription, properties, options) {
    const includeNullValues = options.includeNullValues;
    const fragments = [];
    for (const propertyName of properties) {
        const value = fileDescription[propertyName];
        if (propertyName === "captured") {
            fragments.push(...buildCapturedFragments(value, options?.capturedKeys, includeNullValues));
            continue;
        }
        if (shouldSkipFragmentValue(value, includeNullValues)) {
            continue;
        }
        if (propertyName === "categories") {
            const label = (0, Shared_1.isArray)(value) && value.length > 1 ? "categories" : "category";
            fragments.push(formatPropertyFragment(label, value));
            continue;
        }
        fragments.push(formatPropertyFragment(propertyName, value));
    }
    return fragments;
}
/**
 * Describes file metadata using selected relevant properties.
 * @param fileDescription - File metadata to describe.
 * @param properties - List of file properties to include in the description.
 * @param options - Formatting options.
 * @returns Formatted message describing the file.
 */
function fileDescriptionMessage(fileDescription, properties, { includeNullValues = false } = {}) {
    const propertyFragments = buildFilePropertyFragments(fileDescription, properties, {
        includeNullValues,
    });
    if (!propertyFragments.length) {
        return "";
    }
    return `file of ${joinWithCommasAndAnd(propertyFragments)}`;
}
/**
 * Describes file metadata using selector-driven relevant properties.
 * @param fileDescription - File metadata to describe.
 * @param selectorData - Selector data that determines which file properties and captured keys to include.
 * @returns Formatted message describing the file metadata.
 */
function fileDescriptionMessageFromSelector(fileDescription, selectorData) {
    if (!selectorData) {
        return null;
    }
    const properties = Object.keys(selectorData);
    if (!properties.length) {
        return null;
    }
    const capturedKeys = (0, Shared_1.isObject)(selectorData.captured)
        ? Object.keys(selectorData.captured)
        : undefined;
    const propertyFragments = buildFilePropertyFragments(fileDescription, properties, {
        capturedKeys,
        includeNullValues: true,
    });
    if (!propertyFragments.length) {
        return null;
    }
    return `file of ${joinWithCommasAndAnd(propertyFragments)}`;
}
/**
 * Builds message fragments from selected module properties.
 * @param moduleDescription - Module metadata to describe.
 * @param properties - List of module properties to include.
 * @param options - Formatting options.
 * @returns List of formatted fragments describing module.
 */
function buildModulePropertyFragments(moduleDescription, properties, options) {
    const fragments = [];
    for (const propertyName of properties) {
        const value = moduleDescription[propertyName];
        if (shouldSkipFragmentValue(value, options.includeNullValues)) {
            continue;
        }
        fragments.push(formatPropertyFragment(propertyName, value));
    }
    return fragments;
}
/**
 * Describes module metadata using selector-driven relevant properties.
 * @param moduleDescription - Module metadata to describe.
 * @param selectorData - Selector data that determines which module properties to include.
 * @returns Formatted message describing module metadata.
 */
function moduleDescriptionMessageFromSelector(moduleDescription, selectorData) {
    if (!selectorData) {
        return null;
    }
    const properties = Object.keys(selectorData);
    if (!properties.length) {
        return null;
    }
    const propertyFragments = buildModulePropertyFragments(moduleDescription, properties, {
        includeNullValues: true,
    });
    if (!propertyFragments.length) {
        return null;
    }
    return `module with ${joinWithCommasAndAnd(propertyFragments)}`;
}
/**
 * Describes entities using selector-driven relevant properties from element, file and module.
 * When both file and element are present, the file is described first with "belonging to" linking to the element.
 * @param entityDescription - Entity metadata to describe.
 * @param selectorData - Selector data determining which entity parts to include.
 * @returns Formatted message describing the entity metadata.
 */
function entityDescriptionMessageFromSelector(entityDescription, selectorData, { includeModule = true } = {}) {
    /* istanbul ignore next -- Defensive: callers always guard with selector key length > 0 */
    if (!selectorData) {
        return null;
    }
    const elementPart = elementDescriptionMessageFromSelector(entityDescription.element, selectorData.element ?? null);
    const filePart = fileDescriptionMessageFromSelector(entityDescription.file, selectorData.file);
    const modulePart = includeModule
        ? moduleDescriptionMessageFromSelector(entityDescription.module, selectorData.module)
        : null;
    if (!elementPart && !filePart && !modulePart) {
        return null;
    }
    let mainPart;
    if (filePart && elementPart) {
        mainPart = `${filePart} belonging to ${elementPart}`;
    }
    else {
        mainPart = filePart ?? elementPart;
    }
    if (mainPart && modulePart) {
        return `${mainPart} and ${modulePart}`;
    }
    return mainPart ?? modulePart;
}
/**
 * Describes target-module selector data as dependency metadata when building selector-based messages.
 * Legacy selectors with only `to.module.source` are rendered as dependency `source`.
 * @param toSelectorData - Selector data from the target entity.
 * @param dependency - Dependency description used to read actual values.
 * @returns Formatted dependency metadata fragment derived from target module selector data.
 */
function dependencySourceFromToSelectorMessage(toSelectorData, dependency) {
    if (!toSelectorData?.module) {
        return [];
    }
    const fragments = [];
    if (!(0, Shared_1.isUndefined)(toSelectorData.module.source) &&
        shouldRenderDependencyValue(dependency.to.module.source, true)) {
        fragments.push(formatPropertyFragment("module source", dependency.to.module.source));
    }
    if (!(0, Shared_1.isUndefined)(toSelectorData.module.internalPath) &&
        shouldRenderDependencyValue(dependency.to.module.internalPath, true)) {
        fragments.push(formatPropertyFragment("module internalPath", dependency.to.module.internalPath));
    }
    return fragments;
}
/**
 * Describes entities for no-rule messages, including both element and file metadata when available.
 * When both file and element are present, the file is described first with "belonging to" linking to the element.
 * @param entityDescription - Entity metadata to describe.
 * @returns Formatted message describing available entity metadata.
 */
function entityDescriptionMessageForNoRule(entityDescription) {
    const elementPart = elementDescriptionMessage(entityDescription.element, [
        "type",
        "category",
        "captured",
    ]);
    const filePart = fileDescriptionMessage(entityDescription.file, [
        "categories",
        "captured",
    ]);
    if (filePart && elementPart) {
        return `${filePart} belonging to ${elementPart}`;
    }
    return filePart || elementPart;
}
/**
 * Builds message fragments for dependency metadata from selected properties.
 * @param dependencyInfo - Dependency metadata to describe.
 * @param properties - List of dependency metadata properties to include in the description.
 * @param options - Additional options for handling specific properties like "relationship".
 * @param options.relationshipKeys - If "relationship" is included in properties, specifies which relationship sides ("from", "to") to include in the description.
 * @returns List of formatted message fragments describing the dependency metadata.
 */
function buildDependencyPropertyFragments(dependencyInfo, properties, options) {
    const fragments = [];
    const includeNullValues = options?.includeNullValues ?? false;
    for (const propertyName of properties) {
        const value = dependencyInfo[propertyName];
        if (!shouldRenderDependencyValue(value, includeNullValues)) {
            continue;
        }
        if (propertyName === "relationship" && (0, Shared_1.isObject)(value)) {
            fragments.push(...buildRelationshipFragments(value, options?.relationshipKeys, includeNullValues));
            continue;
        }
        fragments.push(formatPropertyFragment(propertyName, value));
    }
    return fragments;
}
/**
 * Describes dependency metadata using selected relevant properties.
 * @param dependencyInfo - Dependency metadata to describe.
 * @param properties - List of dependency metadata properties to include in the description.
 * @returns Formatted message describing the dependency metadata based on the selected properties.
 */
function dependencyDescriptionMessage(dependencyInfo, properties, options) {
    const propertyFragments = buildDependencyPropertyFragments(dependencyInfo, properties, {
        includeNullValues: options?.includeNullValues,
    });
    if (!propertyFragments.length) {
        return "";
    }
    return joinWithCommasAndAnd(propertyFragments);
}
/**
 * Builds dependency metadata fragments using selector-driven relevant properties.
 * @param dependencyInfo - Dependency metadata to describe.
 * @param selectorData - Selector data that determines which properties to include in the description.
 * @returns Ordered list of dependency fragments.
 */
function dependencyDescriptionFragmentsFromSelector(dependencyInfo, selectorData) {
    /* istanbul ignore next -- Defensive: caller only invokes when the selector has at least one key */
    if (!selectorData) {
        return [];
    }
    const properties = Object.keys(selectorData);
    /* istanbul ignore next -- Defensive: caller only invokes when the selector has at least one key */
    if (!properties.length) {
        return [];
    }
    const relationshipKeys = (0, Shared_1.isObject)(selectorData.relationship)
        ? Object.keys(selectorData.relationship)
        : undefined;
    return buildDependencyPropertyFragments(dependencyInfo, properties, {
        relationshipKeys,
        includeNullValues: true,
    });
}
/**
 * Resolves the fallback no-rules message from available description fragments.
 * @param fromDescription - Description of the source element.
 * @param toDescription - Description of the target element.
 * @param dependencyDescription - Description of dependency metadata.
 * @returns The most specific no-rules message that can be composed.
 */
function resolveNoRulesMatchedMessage(fromDescription, toDescription, dependencyDescription) {
    if (fromDescription && toDescription) {
        return `${NO_RULE_MESSAGE} from ${fromDescription} to ${toDescription}`;
    }
    if (fromDescription && dependencyDescription) {
        return `${NO_RULE_MESSAGE} from ${fromDescription} with ${dependencyDescription}`;
    }
    if (toDescription && dependencyDescription) {
        return `${NO_RULE_MESSAGE} to ${toDescription} with ${dependencyDescription}`;
    }
    if (fromDescription) {
        return `${NO_RULE_MESSAGE} from ${fromDescription}`;
    }
    if (toDescription) {
        return `${NO_RULE_MESSAGE} to ${toDescription}`;
    }
    if (dependencyDescription) {
        return `${NO_RULE_MESSAGE} with ${dependencyDescription}`;
    }
    return MESSAGE_ERROR;
}
/**
 * Builds the fallback no-rules message when no rule matches a dependency.
 * @param dependency - Dependency description used to derive message details.
 * @returns Human-readable fallback message for no-rules scenarios.
 */
function dependenciesNoRuleMatchedMessage(dependency) {
    const fromDescription = entityDescriptionMessageForNoRule(dependency.from);
    const toEntityDescription = entityDescriptionMessageForNoRule(dependency.to);
    const targetModuleOrigin = dependency.to.module.origin;
    const targetModuleSource = dependency.to.module.source;
    const isExternalOrigin = targetModuleOrigin === "external";
    const targetModuleSourceSuffix = shouldRenderDependencyValue(targetModuleSource, false)
        ? ` and module source ${formatPropertyValue(targetModuleSource)}`
        : "";
    const targetModuleDescription = shouldRenderDependencyValue(targetModuleOrigin, false)
        ? `module with origin ${formatPropertyValue(targetModuleOrigin)}${targetModuleSourceSuffix}`
        : "";
    let toDescription = toEntityDescription ||
        (targetModuleDescription ? `entities of ${targetModuleDescription}` : "");
    if (toEntityDescription && targetModuleDescription && isExternalOrigin) {
        toDescription = `entities of ${targetModuleDescription} being ${toEntityDescription}`;
    }
    const dependencyDescription = shouldRenderDependencyValue(targetModuleSource, false)
        ? ""
        : dependencyDescriptionMessage(dependency.dependency, ["source"]);
    return resolveNoRulesMatchedMessage(fromDescription, toDescription, dependencyDescription);
}
/**
 * Selects the wording of a dependencies rule violation message based on which
 * of its parts (dependency, target and source) are available.
 * @param effectiveDependencyPart - Message fragment describing the dependency, or empty string when not available.
 * @param toPart - Message fragment describing the target entity, or null when not available.
 * @param fromPart - Message fragment describing the source entity, or null when not available.
 * @returns Formatted violation message, or the generic {@link MESSAGE_ERROR} when no part is available.
 */
function selectDependencyMatchedMessage(effectiveDependencyPart, toPart, fromPart) {
    if (effectiveDependencyPart && toPart && fromPart) {
        return `Dependencies with ${effectiveDependencyPart} to ${toPart} are not allowed in ${fromPart}`;
    }
    if (effectiveDependencyPart && toPart) {
        return `Dependencies with ${effectiveDependencyPart} to ${toPart} are not allowed`;
    }
    if (effectiveDependencyPart && fromPart) {
        return `Dependencies with ${effectiveDependencyPart} are not allowed in ${fromPart}`;
    }
    if (toPart && fromPart) {
        return `Dependencies to ${toPart} are not allowed in ${fromPart}`;
    }
    if (toPart) {
        return `Dependencies to ${toPart} are not allowed`;
    }
    if (fromPart) {
        return `Dependencies are not allowed in ${fromPart}`;
    }
    if (effectiveDependencyPart) {
        return `Dependencies with ${effectiveDependencyPart} are not allowed`;
    }
    return MESSAGE_ERROR;
}
/**
 * Builds the default message for dependencies rule violations from the matching selector data.
 * @param matchResult - Result of matching the dependency against the rule's selector, containing the relevant selector data for the from/to elements and the dependency metadata.
 * @param ruleIndex - Index of the matching rule.
 * @param dependency - Described dependency that triggered the violation, used to extract element and dependency metadata for message construction.
 * @returns Formatted error message describing the violation based on the matching selector data.
 */
function dependenciesRuleMatchedMessage(matchResult, ruleIndex, dependency) {
    const fromProperties = Object.keys(matchResult?.from ?? {});
    const toProperties = Object.keys(matchResult?.to ?? {});
    const dependencyProperties = Object.keys(matchResult?.dependency ?? {});
    const fromPart = fromProperties.length
        ? entityDescriptionMessageFromSelector(dependency.from, matchResult.from)
        : null;
    const toEntityPart = toProperties.length
        ? entityDescriptionMessageFromSelector(dependency.to, matchResult.to, {
            includeModule: false,
        })
        : null;
    const toModulePart = shouldRenderDependencyValue(matchResult?.to?.module?.origin, true)
        ? `entities of module with origin ${formatPropertyValue(dependency.to.module.origin)}`
        : null;
    const toPart = toEntityPart ?? toModulePart;
    const dependencyFragments = dependencyProperties.length
        ? dependencyDescriptionFragmentsFromSelector(dependency.dependency, 
        /* istanbul ignore next -- Defensive: dependencyProperties.length guard ensures matchResult.dependency is defined */
        matchResult.dependency ?? null)
        : [];
    const dependencyToSourceFragments = dependencySourceFromToSelectorMessage(matchResult?.to, dependency);
    if (dependencyToSourceFragments.length) {
        const specifiersIndex = dependencyFragments.findIndex((fragment) => fragment.startsWith("specifiers "));
        if (specifiersIndex === -1) {
            dependencyFragments.push(...dependencyToSourceFragments);
        }
        else {
            dependencyFragments.splice(specifiersIndex, 0, ...dependencyToSourceFragments);
        }
    }
    const effectiveDependencyPart = joinWithCommasAndAnd(dependencyFragments);
    const message = selectDependencyMatchedMessage(effectiveDependencyPart, toPart, fromPart);
    return `${capitalizeFirstLetter(message)}. Denied by policy at index ${ruleIndex}`;
}
/**
 * Builds the default message for dependencies rule violations from the matching selector data.
 * @param matchResult - Result of matching the dependency against the rule's selector, containing the relevant selector data for the from/to elements and the dependency metadata.
 * @param ruleIndex - Index of the matching rule.
 * @param dependency - Described dependency that triggered the violation, used to extract element and dependency metadata for message construction.
 * @returns Formatted error message describing the violation based on the matching selector data.
 */
function dependenciesRuleDefaultErrorMessage(matchResult, ruleIndex, dependency) {
    if ((0, Shared_1.isNull)(ruleIndex)) {
        return dependenciesNoRuleMatchedMessage(dependency);
    }
    return dependenciesRuleMatchedMessage(matchResult, ruleIndex, dependency);
}
