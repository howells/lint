"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSettingsKey = isSettingsKey;
exports.isDependencyNodeKey = isDependencyNodeKey;
exports.isLegacyElementDescriptorType = isLegacyElementDescriptorType;
exports.transformLegacyTypes = transformLegacyTypes;
exports.isValidDependencyNodeSelector = isValidDependencyNodeSelector;
exports.deprecateTypes = deprecateTypes;
exports.deprecateAlias = deprecateAlias;
exports.validateDebugFilterSelectors = validateDebugFilterSelectors;
exports.validateDebugFilesFilter = validateDebugFilesFilter;
exports.validateDebugDependenciesFilter = validateDebugDependenciesFilter;
exports.getSettings = getSettings;
const node_path_1 = require("node:path");
const elements_1 = require("@boundaries/elements");
const Debug_1 = require("../Debug");
const Shared_1 = require("../Shared");
const Settings_types_1 = require("../Shared/Settings.types");
const Docs_1 = require("./Docs");
const { TYPES, ELEMENTS, DEPENDENCY_NODES, ADDITIONAL_DEPENDENCY_NODES, DEFAULT_DEPENDENCY_NODES, ENV_ROOT_PATH, } = Settings_types_1.SETTINGS;
const trackedValidatedSettings = new WeakMap();
/**
 * Type guard to check if a value is a valid key for the plugin settings.
 * @param value - The value to check.
 * @returns True if the value is a valid settings key, false otherwise.
 */
function isSettingsKey(value) {
    return ((0, Shared_1.isString)(value) &&
        Object.values(Settings_types_1.SETTINGS_KEYS_MAP).includes(value));
}
/**
 * Type guard to check if a value is a valid DependencyNodeKey.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyNodeKey, false otherwise.
 */
function isDependencyNodeKey(value) {
    return ((0, Shared_1.isString)(value) &&
        Object.values(Settings_types_1.DEPENDENCY_NODE_KEYS_MAP).includes(value));
}
/**
 * Type guard for legacy element descriptors declared as plain strings.
 *
 * @param type - Value to check.
 * @returns `true` when the value is a legacy string descriptor.
 */
function isLegacyElementDescriptorType(type) {
    return (0, Shared_1.isString)(type);
}
/**
 * Converts legacy string element descriptors into object descriptors.
 *
 * @param typesFromSettings - Raw `boundaries/elements` setting value.
 * @returns Normalized element descriptors compatible with current matcher API.
 */
function transformLegacyTypes(typesFromSettings) {
    const types = typesFromSettings || [];
    return types.map((type) => {
        // backward compatibility with v1
        if (isLegacyElementDescriptorType(type)) {
            return {
                type: type,
                match: elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
                pattern: `${type}/*`,
                capture: ["elementName"],
            };
        }
        // default options
        return {
            match: elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
            ...type,
        };
    });
}
/**
 * Validates one custom dependency-node selector object.
 *
 * @param selector - Candidate additional dependency node selector.
 * @returns `true` when selector has a valid shape.
 */
function isValidDependencyNodeSelector(selector) {
    const isValidObject = (0, Shared_1.isObject)(selector) &&
        (0, Shared_1.isString)(selector.selector) &&
        (!selector.kind || (0, elements_1.isDependencyKind)(selector.kind)) &&
        (!selector.name || (0, Shared_1.isString)(selector.name));
    if (!isValidObject) {
        (0, Debug_1.warnOnce)(`Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting.`, `The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. The invalid object will be ignored. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    }
    else if ((0, Shared_1.isObject)(selector) && !selector.name) {
        (0, Debug_1.warnOnce)(`Consider adding a "name" property to your custom dependency node for using it in selectors and custom messages.`, (0, Docs_1.moreInfoSettingsLink)());
    }
    return isValidObject;
}
/**
 * Emits deprecation warning for legacy `types` setting.
 *
 * @param types - Legacy types setting value when present.
 * @param legacyWarnings - When `false`, skips detection and warning entirely.
 * @returns `true` when a legacy pattern was present.
 */
function deprecateTypes(types, legacyWarnings) {
    if (!legacyWarnings)
        return false;
    if (!types)
        return false;
    (0, Debug_1.warnOnce)(`'${TYPES}' setting is deprecated.`, `Please use '${ELEMENTS}' instead. ${(0, Docs_1.migrationToV2GuideLink)()}`);
    return true;
}
/**
 * Emits deprecation warning for legacy `alias` setting.
 *
 * @param alias - Legacy alias setting value when present.
 * @param legacyWarnings - When `false`, skips detection and warning entirely.
 * @returns `true` when a legacy pattern was present.
 */
function deprecateAlias(alias, legacyWarnings) {
    if (!legacyWarnings)
        return false;
    // cspell:ignore boundariesalias -- documentation anchor for the boundaries/alias setting
    if (!alias)
        return false;
    (0, Debug_1.warnOnce)(`'${Settings_types_1.SETTINGS_KEYS_MAP.ALIAS}' setting is deprecated.`, `Configure path aliases using 'import/resolver' settings instead. ${(0, Docs_1.moreInfoLegacySettingsLink)("boundariesalias")}`);
    return true;
}
/**
 * Validates debug filter selectors for files or dependencies.
 *
 * @param value - Raw filter value.
 * @param filterName - Filter key used in warning messages.
 * @returns Filter array when valid, otherwise `undefined`.
 */
function validateDebugFilterSelectors(value, filterName) {
    if ((0, Shared_1.isUndefined)(value)) {
        return undefined;
    }
    if (filterName === "files" && (0, elements_1.isEntitySelector)(value)) {
        return (0, elements_1.normalizeEntitySelector)(value);
    }
    if ((0, elements_1.isFileSelector)(value)) {
        return (0, elements_1.normalizeFileSelector)(value);
    }
    (0, Debug_1.warnOnce)(`Please provide a valid array for '${filterName}' in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
    return undefined;
}
/**
 * Validates debug `files` filter selector list.
 *
 * @param value - Raw `debug.filter.files` setting value.
 * @returns Valid files filter selectors.
 */
function validateDebugFilesFilter(value) {
    return validateDebugFilterSelectors(value, "files");
}
/**
 * Validates debug `dependencies` filter selector list.
 *
 * @param value - Raw `debug.filter.dependencies` setting value.
 * @returns Valid dependency filter selectors.
 */
function validateDebugDependenciesFilter(value) {
    if ((0, elements_1.isDependencySelector)(value)) {
        return (0, elements_1.normalizeDependencySelector)(value);
    }
}
/**
 * Validates and normalizes `debug.enabled` when provided.
 *
 * @param enabled - Raw `debug.enabled` value.
 * @returns Normalized boolean value or `undefined` when not provided/invalid.
 */
function getNormalizedDebugEnabled(enabled) {
    if ((0, Shared_1.isUndefined)(enabled)) {
        return undefined;
    }
    if ((0, Shared_1.isBoolean)(enabled)) {
        return enabled;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid boolean for 'enabled' in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
    return undefined;
}
/**
 * Validates and normalizes a `debug.messages.*` boolean flag when provided.
 *
 * @param messages - Raw `debug.messages` object.
 * @param key - Message flag key to validate.
 * @returns Normalized boolean flag or `undefined` when not provided/invalid.
 */
function getNormalizedDebugMessageFlag(messages, key) {
    const value = messages[key];
    if ((0, Shared_1.isUndefined)(value)) {
        return undefined;
    }
    if ((0, Shared_1.isBoolean)(value)) {
        return value;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid boolean for 'messages.${key}' in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
    return undefined;
}
/**
 * Validates and normalizes `debug.messages` object and known flags.
 *
 * @param messages - Raw `debug.messages` value.
 * @returns Normalized debug messages configuration.
 */
function getNormalizedDebugMessages(messages) {
    const defaults = {
        files: true,
        dependencies: true,
        violations: true,
    };
    if ((0, Shared_1.isUndefined)(messages)) {
        return defaults;
    }
    if (!(0, Shared_1.isObject)(messages)) {
        (0, Debug_1.warnOnce)(`Please provide a valid object for 'messages' in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
        return defaults;
    }
    return {
        files: getNormalizedDebugMessageFlag(messages, "files") ?? defaults.files,
        dependencies: getNormalizedDebugMessageFlag(messages, "dependencies") ??
            defaults.dependencies,
        violations: getNormalizedDebugMessageFlag(messages, "violations") ??
            defaults.violations,
    };
}
/**
 * Validates and normalizes `debug.filter` object and supported selectors.
 *
 * @param filter - Raw `debug.filter` value.
 * @returns Normalized debug filter configuration.
 */
function getNormalizedDebugFilter(filter) {
    const defaults = {
        files: undefined,
        dependencies: undefined,
    };
    if ((0, Shared_1.isUndefined)(filter)) {
        return defaults;
    }
    if (!(0, Shared_1.isObject)(filter)) {
        (0, Debug_1.warnOnce)(`Please provide a valid object for 'filter' in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
        return defaults;
    }
    return {
        files: validateDebugFilesFilter(filter.files),
        dependencies: validateDebugDependenciesFilter(filter.dependencies),
    };
}
/**
 * Validates the `debug` setting object and nested filters.
 *
 * @param debug - Raw debug setting value.
 * @returns Normalized debug setting when valid.
 */
function getNormalizedDebug(debug) {
    const defaults = {
        enabled: false,
        filter: {
            files: undefined,
            dependencies: undefined,
        },
        messages: {
            files: true,
            dependencies: true,
            violations: true,
        },
    };
    if (!debug) {
        return defaults;
    }
    if (!(0, Shared_1.isObject)(debug)) {
        (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.DEBUG}' setting.`, `The value should be an object. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        return defaults;
    }
    return {
        enabled: getNormalizedDebugEnabled(debug.enabled) ?? defaults.enabled,
        messages: getNormalizedDebugMessages(debug.messages),
        filter: getNormalizedDebugFilter(debug.filter),
    };
}
/**
 * Normalizes and filters element descriptors, validating and warning on invalid entries.
 *
 * @param elements - Raw element descriptors from settings.
 * @param legacyTypes - Fallback legacy types setting for backward compatibility.
 * @param legacyWarnings - When `false`, skips all legacy deprecation detection and warnings.
 * @returns Filtered array of valid element descriptors and whether a legacy pattern was detected.
 */
function getNormalizedElementDescriptors(elements, legacyTypes, legacyWarnings) {
    const typesLegacy = deprecateTypes(legacyTypes, legacyWarnings);
    const rawElements = elements || legacyTypes;
    if (!rawElements || !(0, Shared_1.isArray)(rawElements) || !rawElements.length) {
        // Element descriptors are optional on their own: the file layer can be the
        // only configured classification. The "no classification at all" case is
        // warned once in `getSettings`, where both layers are known.
        return { descriptors: [], legacyDetected: typesLegacy };
    }
    const elementDescriptors = transformLegacyTypes(rawElements);
    const validElementDescriptors = elementDescriptors.filter(elements_1.isElementDescriptor);
    if (validElementDescriptors.length < elementDescriptors.length) {
        const invalidDescriptors = elementDescriptors.filter((desc) => !(0, elements_1.isElementDescriptor)(desc));
        (0, Debug_1.warnOnce)(`Some element descriptors are invalid and will be ignored.`, `Invalid descriptors:\n${JSON.stringify(invalidDescriptors)}.\n${(0, Docs_1.moreInfoSettingsLink)()}`);
    }
    let legacyDetected = typesLegacy;
    if (legacyWarnings) {
        // cspell:ignore partialmatch -- documentation anchor for the partialMatch option
        if (validElementDescriptors.some((d) => d.mode !== undefined)) {
            (0, Debug_1.warnOnce)(`The 'mode' option in element descriptors is deprecated and will be removed in a future major version.`, `Use 'partialMatch: false' instead of 'mode: "full"'. Remove 'mode: "folder"' (it is the default). ${(0, Docs_1.migrationToV7GuideLink)("deprecated-mode-in-element-descriptors")}`);
            legacyDetected = true;
        }
        if (validElementDescriptors.some((d) => d.category !== undefined)) {
            (0, Debug_1.warnOnce)(`The 'category' option in element descriptors is deprecated and will be removed in a future major version.`, `Use the 'category' property in file descriptors ('${Settings_types_1.SETTINGS_KEYS_MAP.FILES}') instead. ${(0, Docs_1.migrationToV7GuideLink)("deprecated-category-in-element-descriptors-and-selectors")}`);
            legacyDetected = true;
        }
    }
    const conflictingDescriptors = validElementDescriptors.filter((d) => d.partialMatch === false && d.mode !== undefined);
    if (conflictingDescriptors.length > 0) {
        (0, Debug_1.warnOnce)(`The 'mode' option has no effect when 'partialMatch: false' is set.`, `Remove 'mode' from these element descriptors: ${JSON.stringify(conflictingDescriptors.map((d) => d.pattern))}. ${(0, Docs_1.moreInfoElementsLink)("partialmatch-optional")}`);
    }
    const FILE_EXTENSION_RE = /\.[a-zA-Z0-9]+/;
    const fileLikeDescriptors = validElementDescriptors.filter((d) => {
        const isEffectiveFolderMode = d.partialMatch === false ||
            !d.mode ||
            d.mode === elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
        if (!isEffectiveFolderMode)
            return false;
        const patterns = Array.isArray(d.pattern) ? d.pattern : [d.pattern];
        return patterns.some((p) => FILE_EXTENSION_RE.test(p.split("/").pop()));
    });
    if (fileLikeDescriptors.length > 0) {
        (0, Debug_1.warnOnce)(`Some element descriptors appear to use file patterns.`, `Element patterns match folders, not individual files. For file classification, use file descriptors ('boundaries/files'). Affected patterns: ${JSON.stringify(fileLikeDescriptors.map((d) => d.pattern))}. ${(0, Docs_1.moreInfoElementsLink)("partialmatch-optional")}`);
    }
    return { descriptors: validElementDescriptors, legacyDetected };
}
/**
 * Normalizes and filters file descriptors, validating and warning on invalid entries.
 *
 * @param fileDescriptors - Raw file descriptors from settings.
 * @returns Filtered array of valid file descriptors.
 */
function getNormalizedFileDescriptors(fileDescriptors) {
    if (!fileDescriptors || !(0, Shared_1.isArray)(fileDescriptors)) {
        return [];
    }
    const validFileDescriptors = fileDescriptors.filter((desc) => (0, elements_1.isFileDescriptor)(desc));
    if (validFileDescriptors.length < fileDescriptors.length) {
        const invalidFileDescriptors = fileDescriptors.filter((desc) => !(0, elements_1.isFileDescriptor)(desc));
        (0, Debug_1.warnOnce)(`Some file descriptors are invalid and will be ignored.`, `Invalid descriptors:\n${JSON.stringify(invalidFileDescriptors)}.\n${(0, Docs_1.moreInfoSettingsLink)()}`);
    }
    return validFileDescriptors;
}
/**
 * Normalizes and filters dependency node keys, validating and warning on invalid entries.
 *
 * @param dependencyNodes - Raw dependency node keys from settings.
 * @returns Expanded array of dependency node selectors with defaults.
 */
function getNormalizedDependencyNodes(dependencyNodes) {
    if (!dependencyNodes) {
        const defaultKeys = [
            Settings_types_1.DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            Settings_types_1.DEPENDENCY_NODE_KEYS_MAP.EXPORT,
            Settings_types_1.DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
            Settings_types_1.DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
        ];
        return defaultKeys
            .flatMap((key) => [...DEFAULT_DEPENDENCY_NODES[key]])
            .filter(Boolean);
    }
    if (!(0, Shared_1.isArray)(dependencyNodes)) {
        const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
        (0, Debug_1.warnOnce)(`Invalid ${DEPENDENCY_NODES} setting format.`, `It should be an array of the following strings: "${defaultNodesNames.join('", "')}". ${(0, Docs_1.moreInfoSettingsLink)()}`);
        return [];
    }
    const validKeys = dependencyNodes.filter(isDependencyNodeKey);
    if (validKeys.length < dependencyNodes.length) {
        const invalidKeys = dependencyNodes.filter((key) => !isDependencyNodeKey(key));
        const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
        (0, Debug_1.warnOnce)(`Invalid values in ${DEPENDENCY_NODES} setting.`, `Invalid values: ${JSON.stringify(invalidKeys)}. Valid strings are: "${defaultNodesNames.join('", "')}". ${(0, Docs_1.moreInfoSettingsLink)()}`);
    }
    return validKeys
        .flatMap((key) => [...DEFAULT_DEPENDENCY_NODES[key]])
        .filter(Boolean);
}
/**
 * Normalizes additional dependency node selectors, validating and warning on invalid entries.
 *
 * @param additionalNodes - Raw additional dependency node selectors from settings.
 * @returns Array of valid additional dependency node selectors or empty array.
 */
function getNormalizedAdditionalDependencyNodes(additionalNodes) {
    if (!additionalNodes) {
        return [];
    }
    if (!(0, Shared_1.isArray)(additionalNodes)) {
        (0, Debug_1.warnOnce)(`Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting format.`, `It should be an array containing objects with properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        return [];
    }
    const validNodes = additionalNodes.filter(isValidDependencyNodeSelector);
    if (validNodes.length < additionalNodes.length) {
        const invalidNodes = additionalNodes.filter((node) => !isValidDependencyNodeSelector(node));
        (0, Debug_1.warnOnce)(`Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting.`, `Invalid nodes: ${JSON.stringify(invalidNodes)}. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    }
    return validNodes;
}
/**
 * Normalizes ignore setting, converting to array format and validating.
 *
 * @param ignore - Raw ignore setting value.
 * @returns Array of ignore paths or undefined.
 */
function getNormalizedIgnorePaths(ignore) {
    if (!ignore) {
        return undefined;
    }
    if ((0, Shared_1.isString)(ignore)) {
        return [ignore];
    }
    if ((0, Shared_1.isArray)(ignore) && ignore.every(Shared_1.isString)) {
        return ignore;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.IGNORE}' setting.`, `The value should be a string or an array of strings. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return undefined;
}
/**
 * Normalizes include setting, converting to array format and validating.
 *
 * @param include - Raw include setting value.
 * @returns Array of include paths or undefined.
 */
function getNormalizedIncludePaths(include) {
    if (!include) {
        return undefined;
    }
    if ((0, Shared_1.isString)(include)) {
        return [include];
    }
    if ((0, Shared_1.isArray)(include) && include.every(Shared_1.isString)) {
        return include;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.INCLUDE}' setting.`, `The value should be a string or an array of strings. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return undefined;
}
/**
 * Normalizes root-path setting and resolves effective root path with environment variable support.
 *
 * @param rootPath - Raw root-path setting value.
 * @returns Resolved absolute root path.
 */
function getNormalizedRootPath(rootPath) {
    const userSetting = rootPath && (0, Shared_1.isString)(rootPath) ? rootPath : undefined;
    const envRootPath = process.env[ENV_ROOT_PATH];
    const effectiveRootPath = envRootPath || userSetting;
    if (!effectiveRootPath) {
        return process.cwd();
    }
    if ((0, node_path_1.isAbsolute)(effectiveRootPath)) {
        return effectiveRootPath;
    }
    if (!userSetting) {
        (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`, `The value should be a string. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        return process.cwd();
    }
    return (0, node_path_1.resolve)(process.cwd(), effectiveRootPath);
}
/**
 * Normalizes legacy templates setting, validating and applying defaults.
 *
 * @param legacyTemplates - Raw legacy templates setting value.
 * @param legacyWarnings - When `false`, skips the deprecation warning.
 * @returns Normalized value and whether a legacy pattern was detected.
 */
function getNormalizedLegacyTemplates(legacyTemplates, legacyWarnings) {
    if ((0, Shared_1.isUndefined)(legacyTemplates)) {
        return { value: Settings_types_1.LEGACY_TEMPLATES_DEFAULT, legacyDetected: false };
    }
    if ((0, Shared_1.isBoolean)(legacyTemplates)) {
        const legacyDetected = legacyTemplates === true;
        if (legacyDetected && legacyWarnings) {
            (0, Debug_1.warnOnce)(`'${Settings_types_1.SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated.`, `The legacy \${...} template syntax will not be supported in the next major version. Migrate to the {{...}} Handlebars syntax. ${(0, Docs_1.migrationToV6GuideLink)("new-template-syntax")}`);
        }
        return { value: legacyTemplates, legacyDetected };
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return { value: Settings_types_1.LEGACY_TEMPLATES_DEFAULT, legacyDetected: false };
}
/**
 * Normalizes elements-single-match setting, validating and applying defaults. Falls back to
 * the deprecated elements-single-type setting when elements-single-match is not provided.
 *
 * @param elementsSingleMatch - Raw elements-single-match setting value.
 * @param elementsSingleType - Raw (deprecated) elements-single-type setting value.
 * @param legacyWarnings - When `false`, skips the deprecation warning for elements-single-type.
 * @returns Boolean value or default.
 */
function getNormalizedElementsSingleMatch(elementsSingleMatch, elementsSingleType, legacyWarnings) {
    let legacyValue;
    if (!(0, Shared_1.isUndefined)(elementsSingleType)) {
        if ((0, Shared_1.isBoolean)(elementsSingleType)) {
            legacyValue = elementsSingleType;
        }
        else {
            (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        }
    }
    if ((0, Shared_1.isUndefined)(elementsSingleMatch)) {
        if ((0, Shared_1.isUndefined)(legacyValue)) {
            return Settings_types_1.ELEMENTS_SINGLE_TYPE_DEFAULT;
        }
        if (legacyWarnings) {
            (0, Debug_1.warnOnce)(`'${Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE}' setting is deprecated.`, `Use '${Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH}' instead. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        }
        return legacyValue;
    }
    if ((0, Shared_1.isBoolean)(elementsSingleMatch)) {
        return elementsSingleMatch;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return (0, Shared_1.isUndefined)(legacyValue) ? Settings_types_1.ELEMENTS_SINGLE_TYPE_DEFAULT : legacyValue;
}
/**
 * Normalizes files-single-match setting, validating and applying defaults.
 *
 * @param filesSingleMatch - Raw files-single-match setting value.
 * @returns Boolean value or default.
 */
function getNormalizedFilesSingleMatch(filesSingleMatch) {
    if ((0, Shared_1.isUndefined)(filesSingleMatch)) {
        return Settings_types_1.FILES_SINGLE_MATCH_DEFAULT;
    }
    if ((0, Shared_1.isBoolean)(filesSingleMatch)) {
        return filesSingleMatch;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return Settings_types_1.FILES_SINGLE_MATCH_DEFAULT;
}
/**
 * Normalizes legacy-warnings setting, validating and applying defaults.
 *
 * @param value - Raw legacy-warnings setting value.
 * @returns Boolean value or default (`true`).
 */
function getNormalizedLegacyWarnings(value) {
    if ((0, Shared_1.isUndefined)(value)) {
        return Settings_types_1.LEGACY_WARNINGS_DEFAULT;
    }
    if ((0, Shared_1.isBoolean)(value)) {
        return value;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.LEGACY_WARNINGS}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return Settings_types_1.LEGACY_WARNINGS_DEFAULT;
}
/**
 * Normalizes cache setting, validating and applying defaults.
 *
 * @param cache - Raw cache setting value.
 * @returns Boolean value or default.
 */
function getNormalizedCache(cache) {
    if ((0, Shared_1.isUndefined)(cache)) {
        return Settings_types_1.CACHE_DEFAULT;
    }
    if ((0, Shared_1.isBoolean)(cache)) {
        return cache;
    }
    (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.CACHE}' setting.`, `The value should be a boolean. ${(0, Docs_1.moreInfoSettingsLink)()}`);
    return Settings_types_1.CACHE_DEFAULT;
}
/**
 * Normalizes flag-as-external option, validating and applying defaults.
 *
 * @param flagAsExternal - Raw flag-as-external setting value.
 * @returns Normalized flag-as-external object with defaults.
 */
const BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS = [
    "unresolvableAlias",
    "inNodeModules",
    "outsideRootPath",
];
/**
 * Validates a boolean flag-as-external option, warning and leaving the default
 * untouched when the provided value is not a valid boolean.
 * @param options - Raw flag-as-external options provided by the user.
 * @param validated - Normalized flag-as-external object to update in place.
 * @param key - Name of the boolean option to validate.
 */
function validateBooleanFlagAsExternalOption(options, validated, key) {
    if ((0, Shared_1.isUndefined)(options[key])) {
        return;
    }
    if ((0, Shared_1.isBoolean)(options[key])) {
        validated[key] = options[key];
    }
    else {
        (0, Debug_1.warnOnce)(`Please provide a valid boolean for '${key}' in '${Settings_types_1.SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
    }
}
function getNormalizedFlagAsExternal(flagAsExternal) {
    const defaults = {
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: [],
    };
    if (!flagAsExternal) {
        return defaults;
    }
    if (!(0, Shared_1.isObject)(flagAsExternal)) {
        (0, Debug_1.warnOnce)(`Please provide a valid value in '${Settings_types_1.SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`, `The value should be an object. ${(0, Docs_1.moreInfoSettingsLink)()}`);
        return defaults;
    }
    const validated = { ...defaults };
    const options = flagAsExternal;
    for (const key of BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS) {
        validateBooleanFlagAsExternalOption(options, validated, key);
    }
    if (!(0, Shared_1.isUndefined)(options.customSourcePatterns)) {
        if ((0, Shared_1.isArray)(options.customSourcePatterns) &&
            options.customSourcePatterns.every(Shared_1.isString)) {
            validated.customSourcePatterns = options.customSourcePatterns;
        }
        else {
            (0, Debug_1.warnOnce)(`Please provide a valid array of strings for 'customSourcePatterns' in '${Settings_types_1.SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
        }
    }
    return validated;
}
/**
 * Returns normalized and cached settings from ESLint rule context.
 *
 * @param context - ESLint rule context.
 * @returns Normalized settings object used by rules.
 */
function getSettings(context) {
    const alreadyValidatedSettings = trackedValidatedSettings.get(context.settings);
    if (alreadyValidatedSettings) {
        return alreadyValidatedSettings;
    }
    const settings = context.settings;
    // Must be resolved first so it can be passed to all legacy-detecting helpers.
    const legacyWarnings = getNormalizedLegacyWarnings(settings[Settings_types_1.SETTINGS_KEYS_MAP.LEGACY_WARNINGS]);
    deprecateAlias(settings[Settings_types_1.SETTINGS_KEYS_MAP.ALIAS], legacyWarnings);
    // Normalize all settings from raw values
    const { descriptors: elementDescriptors } = getNormalizedElementDescriptors(settings[ELEMENTS], settings[TYPES], legacyWarnings);
    const fileDescriptors = getNormalizedFileDescriptors(settings[Settings_types_1.SETTINGS_KEYS_MAP.FILES]);
    // At least one classification layer is required. Elements and files are each
    // optional on their own, so only warn when neither layer is configured.
    if (!elementDescriptors.length && !fileDescriptors.length) {
        (0, Debug_1.warnOnce)(`Please provide element descriptors using the '${ELEMENTS}' setting, or file descriptors using the '${Settings_types_1.SETTINGS_KEYS_MAP.FILES}' setting.`, (0, Docs_1.moreInfoSettingsLink)());
    }
    const dependencyNodes = getNormalizedDependencyNodes(settings[DEPENDENCY_NODES]);
    const additionalDependencyNodes = getNormalizedAdditionalDependencyNodes(settings[Settings_types_1.SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]);
    const ignorePaths = getNormalizedIgnorePaths(settings[Settings_types_1.SETTINGS_KEYS_MAP.IGNORE]);
    const includePaths = getNormalizedIncludePaths(settings[Settings_types_1.SETTINGS_KEYS_MAP.INCLUDE]);
    const { value: legacyTemplates } = getNormalizedLegacyTemplates(settings[Settings_types_1.SETTINGS_KEYS_MAP.LEGACY_TEMPLATES], legacyWarnings);
    const elementsSingleMatch = getNormalizedElementsSingleMatch(settings[Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH], settings[Settings_types_1.SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE], legacyWarnings);
    const filesSingleMatch = getNormalizedFilesSingleMatch(settings[Settings_types_1.SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH]);
    const cache = getNormalizedCache(settings[Settings_types_1.SETTINGS_KEYS_MAP.CACHE]);
    const flagAsExternal = getNormalizedFlagAsExternal(settings[Settings_types_1.SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]);
    const debugSetting = getNormalizedDebug(settings[Settings_types_1.SETTINGS_KEYS_MAP.DEBUG]);
    const rootPath = getNormalizedRootPath(settings[Settings_types_1.SETTINGS_KEYS_MAP.ROOT_PATH]);
    const result = {
        elementDescriptors,
        elementsSingleMatch,
        fileDescriptors,
        filesSingleMatch,
        ignorePaths,
        includePaths,
        rootPath,
        dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
        legacyTemplates,
        cache,
        legacyWarnings,
        flagAsExternal,
        debug: debugSetting,
    };
    trackedValidatedSettings.set(context.settings, result);
    return result;
}
