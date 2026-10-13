"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FROM = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ANY = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_FILE = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ELEMENT = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ALL = exports.RULE_POLICIES_MAP = exports.RULE_POLICY_DISALLOW = exports.RULE_POLICY_ALLOW = exports.RULE_EFFECTS_MAP = exports.RULE_EFFECT_DISALLOW = exports.RULE_EFFECT_ALLOW = exports.CHECK_CONFIG_DEFAULT = exports.CACHE_DEFAULT = exports.FILES_SINGLE_MATCH_DEFAULT = exports.ELEMENTS_SINGLE_TYPE_DEFAULT = exports.LEGACY_WARNINGS_DEFAULT = exports.LEGACY_TEMPLATES_DEFAULT = exports.SETTINGS_KEYS_MAP = exports.SETTINGS = exports.DEPENDENCY_NODE_KEYS_MAP = exports.RULE_SHORT_NAMES = exports.RULE_NAMES = exports.RULE_NAMES_MAP = exports.RULE_SHORT_NAMES_MAP = exports.NO_UNKNOWN = exports.NO_UNKNOWN_DEPENDENCIES = exports.NO_UNKNOWN_FILES = exports.NO_PRIVATE = exports.NO_IGNORED = exports.NO_IGNORED_DEPENDENCIES = exports.EXTERNAL = exports.ENTRY_POINT = exports.DEPENDENCIES = exports.ELEMENT_TYPES = exports.DEPENDENCY_NODE_EXPORT = exports.DEPENDENCY_NODE_DYNAMIC_IMPORT = exports.DEPENDENCY_NODE_IMPORT = exports.DEPENDENCY_NODE_REQUIRE = exports.PLUGIN_ISSUES_URL = exports.WEBSITE_URL = exports.REPO_URL = exports.PLUGIN_ENV_VARS_PREFIX = exports.PLUGIN_NAME = void 0;
const elements_1 = require("@boundaries/elements");
// Plugin constants
exports.PLUGIN_NAME = "boundaries";
exports.PLUGIN_ENV_VARS_PREFIX = "ESLINT_PLUGIN_BOUNDARIES";
exports.REPO_URL = "https://github.com/javierbrea/eslint-plugin-boundaries";
exports.WEBSITE_URL = "https://www.jsboundaries.dev";
exports.PLUGIN_ISSUES_URL = `${exports.REPO_URL}/issues`;
exports.DEPENDENCY_NODE_REQUIRE = "require";
exports.DEPENDENCY_NODE_IMPORT = "import";
exports.DEPENDENCY_NODE_DYNAMIC_IMPORT = "dynamic-import";
exports.DEPENDENCY_NODE_EXPORT = "export";
// Rule short names
/** @deprecated Use DEPENDENCIES instead */
exports.ELEMENT_TYPES = "element-types";
exports.DEPENDENCIES = "dependencies";
exports.ENTRY_POINT = "entry-point";
exports.EXTERNAL = "external";
exports.NO_IGNORED_DEPENDENCIES = "no-ignored-dependencies";
/** @deprecated Use NO_IGNORED_DEPENDENCIES instead */
exports.NO_IGNORED = "no-ignored";
exports.NO_PRIVATE = "no-private";
exports.NO_UNKNOWN_FILES = "no-unknown-files";
exports.NO_UNKNOWN_DEPENDENCIES = "no-unknown-dependencies";
/** @deprecated Use NO_UNKNOWN_DEPENDENCIES instead */
exports.NO_UNKNOWN = "no-unknown";
/**
 * Map of all rule short names, without the plugin prefix.
 */
exports.RULE_SHORT_NAMES_MAP = {
    /** @deprecated Use DEPENDENCIES instead */
    ELEMENT_TYPES: exports.ELEMENT_TYPES,
    DEPENDENCIES: exports.DEPENDENCIES,
    ENTRY_POINT: exports.ENTRY_POINT,
    EXTERNAL: exports.EXTERNAL,
    NO_IGNORED_DEPENDENCIES: exports.NO_IGNORED_DEPENDENCIES,
    /** @deprecated Use NO_IGNORED_DEPENDENCIES instead */
    NO_IGNORED: exports.NO_IGNORED,
    NO_PRIVATE: exports.NO_PRIVATE,
    NO_UNKNOWN_FILES: exports.NO_UNKNOWN_FILES,
    NO_UNKNOWN_DEPENDENCIES: exports.NO_UNKNOWN_DEPENDENCIES,
    /** @deprecated Use NO_UNKNOWN_DEPENDENCIES instead */
    NO_UNKNOWN: exports.NO_UNKNOWN,
};
/** @deprecated Use DEPENDENCIES_FULL instead */
const ELEMENT_TYPES_FULL = `${exports.PLUGIN_NAME}/${exports.ELEMENT_TYPES}`;
const DEPENDENCIES_FULL = `${exports.PLUGIN_NAME}/${exports.DEPENDENCIES}`;
const ENTRY_POINT_FULL = `${exports.PLUGIN_NAME}/${exports.ENTRY_POINT}`;
const EXTERNAL_FULL = `${exports.PLUGIN_NAME}/${exports.EXTERNAL}`;
const NO_IGNORED_DEPENDENCIES_FULL = `${exports.PLUGIN_NAME}/${exports.NO_IGNORED_DEPENDENCIES}`;
/** @deprecated Use NO_IGNORED_DEPENDENCIES_FULL instead */
const NO_IGNORED_FULL = `${exports.PLUGIN_NAME}/${exports.NO_IGNORED}`;
const NO_PRIVATE_FULL = `${exports.PLUGIN_NAME}/${exports.NO_PRIVATE}`;
const NO_UNKNOWN_FILES_FULL = `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN_FILES}`;
const NO_UNKNOWN_DEPENDENCIES_FULL = `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN_DEPENDENCIES}`;
/** @deprecated Use NO_UNKNOWN_DEPENDENCIES_FULL instead */
const NO_UNKNOWN_FULL = `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN}`;
/**
 * Map of all rule names, including the default plugin prefix.
 */
exports.RULE_NAMES_MAP = {
    /** @deprecated Use DEPENDENCIES instead */
    ELEMENT_TYPES: ELEMENT_TYPES_FULL,
    DEPENDENCIES: DEPENDENCIES_FULL,
    ENTRY_POINT: ENTRY_POINT_FULL,
    EXTERNAL: EXTERNAL_FULL,
    NO_IGNORED_DEPENDENCIES: NO_IGNORED_DEPENDENCIES_FULL,
    /** @deprecated Use NO_IGNORED_DEPENDENCIES instead */
    NO_IGNORED: NO_IGNORED_FULL,
    NO_PRIVATE: NO_PRIVATE_FULL,
    NO_UNKNOWN_FILES: NO_UNKNOWN_FILES_FULL,
    NO_UNKNOWN_DEPENDENCIES: NO_UNKNOWN_DEPENDENCIES_FULL,
    /** @deprecated Use NO_UNKNOWN_DEPENDENCIES instead */
    NO_UNKNOWN: NO_UNKNOWN_FULL,
};
/**
 * List of all rule names
 */
exports.RULE_NAMES = [...Object.values(exports.RULE_NAMES_MAP)];
/**
 * List of all rule short names, without the plugin prefix.
 */
exports.RULE_SHORT_NAMES = [
    ...Object.values(exports.RULE_SHORT_NAMES_MAP),
];
/**
 * Different types of dependency nodes supported by the plugin by default.
 * Each type corresponds to a common way of importing or requiring modules in JavaScript/TypeScript.
 */
exports.DEPENDENCY_NODE_KEYS_MAP = {
    /**
     * CommonJS require statements, e.g., `const module = require('module')`.
     */
    REQUIRE: exports.DEPENDENCY_NODE_REQUIRE,
    /**
     * ES6 import statements, e.g., `import module from 'module'`.
     */
    IMPORT: exports.DEPENDENCY_NODE_IMPORT,
    /**
     * Dynamic import statements, e.g., `import('module')`.
     */
    DYNAMIC_IMPORT: exports.DEPENDENCY_NODE_DYNAMIC_IMPORT,
    /**
     * Export statements, e.g., `export { module } from 'source'`.
     */
    EXPORT: exports.DEPENDENCY_NODE_EXPORT,
};
exports.SETTINGS = {
    // settings
    ELEMENTS: `${exports.PLUGIN_NAME}/elements`,
    /** @deprecated Use ELEMENTS_SINGLE_MATCH instead */
    ELEMENTS_SINGLE_TYPE: `${exports.PLUGIN_NAME}/elements-single-type`,
    ELEMENTS_SINGLE_MATCH: `${exports.PLUGIN_NAME}/elements-single-match`,
    FILES_SINGLE_MATCH: `${exports.PLUGIN_NAME}/files-single-match`,
    IGNORE: `${exports.PLUGIN_NAME}/ignore`,
    INCLUDE: `${exports.PLUGIN_NAME}/include`,
    ROOT_PATH: `${exports.PLUGIN_NAME}/root-path`,
    DEPENDENCY_NODES: `${exports.PLUGIN_NAME}/dependency-nodes`,
    ADDITIONAL_DEPENDENCY_NODES: `${exports.PLUGIN_NAME}/additional-dependency-nodes`,
    LEGACY_TEMPLATES: `${exports.PLUGIN_NAME}/legacy-templates`,
    CACHE: `${exports.PLUGIN_NAME}/cache`,
    LEGACY_WARNINGS: `${exports.PLUGIN_NAME}/legacy-warnings`,
    FLAG_AS_EXTERNAL: `${exports.PLUGIN_NAME}/flag-as-external`,
    DEBUG_SETTING: `${exports.PLUGIN_NAME}/debug`,
    // env vars
    DEBUG: `${exports.PLUGIN_ENV_VARS_PREFIX}_DEBUG`,
    ENV_ROOT_PATH: `${exports.PLUGIN_ENV_VARS_PREFIX}_ROOT_PATH`,
    // rules
    /** @deprecated Use RULE_DEPENDENCIES instead */
    RULE_ELEMENT_TYPES: `${exports.PLUGIN_NAME}/${exports.ELEMENT_TYPES}`,
    RULE_DEPENDENCIES: `${exports.PLUGIN_NAME}/${exports.DEPENDENCIES}`,
    RULE_ENTRY_POINT: `${exports.PLUGIN_NAME}/${exports.ENTRY_POINT}`,
    RULE_EXTERNAL: `${exports.PLUGIN_NAME}/${exports.EXTERNAL}`,
    RULE_NO_IGNORED_DEPENDENCIES: `${exports.PLUGIN_NAME}/${exports.NO_IGNORED_DEPENDENCIES}`,
    /** @deprecated Use RULE_NO_IGNORED_DEPENDENCIES instead */
    RULE_NO_IGNORED: `${exports.PLUGIN_NAME}/${exports.NO_IGNORED}`,
    RULE_NO_PRIVATE: `${exports.PLUGIN_NAME}/${exports.NO_PRIVATE}`,
    RULE_NO_UNKNOWN_FILES: `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN_FILES}`,
    RULE_NO_UNKNOWN_DEPENDENCIES: `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN_DEPENDENCIES}`,
    /** @deprecated Use RULE_NO_UNKNOWN_DEPENDENCIES instead */
    RULE_NO_UNKNOWN: `${exports.PLUGIN_NAME}/${exports.NO_UNKNOWN}`,
    // deprecated settings
    TYPES: `${exports.PLUGIN_NAME}/types`,
    ALIAS: `${exports.PLUGIN_NAME}/alias`,
    FILES: `${exports.PLUGIN_NAME}/files`,
    // elements settings properties,
    VALID_MODES: [
        elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
        elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FILE,
        elements_1.ELEMENT_DESCRIPTOR_MODES_MAP.FULL,
    ],
    VALID_DEPENDENCY_NODE_KINDS: [
        elements_1.DEPENDENCY_KINDS_MAP.VALUE,
        elements_1.DEPENDENCY_KINDS_MAP.TYPE,
        elements_1.DEPENDENCY_KINDS_MAP.TYPE_OF,
    ],
    DEFAULT_DEPENDENCY_NODES: {
        [exports.DEPENDENCY_NODE_KEYS_MAP.REQUIRE]: [
            // Note: detects "require('source')"
            {
                selector: "CallExpression[callee.name=require] > Literal",
                kind: "value",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
            },
        ],
        [exports.DEPENDENCY_NODE_KEYS_MAP.IMPORT]: [
            // Note: detects "import x from 'source'"
            {
                selector: "ImportDeclaration:not([importKind=type]) > Literal",
                kind: "value",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            },
            // Note: detects "import type x from 'source'"
            {
                selector: "ImportDeclaration[importKind=type] > Literal",
                kind: "type",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            },
        ],
        [exports.DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT]: [
            // Note: detects "import('source')"
            {
                selector: "ImportExpression > Literal",
                kind: "value",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
            },
        ],
        [exports.DEPENDENCY_NODE_KEYS_MAP.EXPORT]: [
            // Note: detects "export * from 'source'";
            {
                selector: "ExportAllDeclaration:not([exportKind=type]) > Literal",
                kind: "value",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.EXPORT,
            },
            // Note: detects "export type * from 'source'";
            {
                selector: "ExportAllDeclaration[exportKind=type] > Literal",
                kind: "type",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.EXPORT,
            },
            // Note: detects "export { x } from 'source'";
            {
                selector: "ExportNamedDeclaration:not([exportKind=type]) > Literal",
                kind: "value",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.EXPORT,
            },
            // Note: detects "export type { x } from 'source'";
            {
                selector: "ExportNamedDeclaration[exportKind=type] > Literal",
                kind: "type",
                name: exports.DEPENDENCY_NODE_KEYS_MAP.EXPORT,
            },
        ],
    },
};
/**
 * Map of the valid keys for the plugin settings.
 */
exports.SETTINGS_KEYS_MAP = {
    ELEMENTS: exports.SETTINGS.ELEMENTS,
    /** @deprecated Use ELEMENTS_SINGLE_MATCH instead */
    ELEMENTS_SINGLE_TYPE: exports.SETTINGS.ELEMENTS_SINGLE_TYPE,
    ELEMENTS_SINGLE_MATCH: exports.SETTINGS.ELEMENTS_SINGLE_MATCH,
    FILES_SINGLE_MATCH: exports.SETTINGS.FILES_SINGLE_MATCH,
    FILES: exports.SETTINGS.FILES,
    IGNORE: exports.SETTINGS.IGNORE,
    INCLUDE: exports.SETTINGS.INCLUDE,
    ROOT_PATH: exports.SETTINGS.ROOT_PATH,
    DEPENDENCY_NODES: exports.SETTINGS.DEPENDENCY_NODES,
    ADDITIONAL_DEPENDENCY_NODES: exports.SETTINGS.ADDITIONAL_DEPENDENCY_NODES,
    LEGACY_TEMPLATES: exports.SETTINGS.LEGACY_TEMPLATES,
    /** @deprecated Use 'ELEMENTS' instead */
    TYPES: exports.SETTINGS.TYPES,
    /** @deprecated Use import/resolver settings instead */
    ALIAS: exports.SETTINGS.ALIAS,
    CACHE: exports.SETTINGS.CACHE,
    LEGACY_WARNINGS: exports.SETTINGS.LEGACY_WARNINGS,
    FLAG_AS_EXTERNAL: exports.SETTINGS.FLAG_AS_EXTERNAL,
    DEBUG: exports.SETTINGS.DEBUG_SETTING,
};
/**
 * Default value for the legacy templates setting.
 */
exports.LEGACY_TEMPLATES_DEFAULT = true;
/**
 * Default value for the legacy-warnings setting.
 */
exports.LEGACY_WARNINGS_DEFAULT = true;
/**
 * Default value for the elements single type/match setting.
 */
exports.ELEMENTS_SINGLE_TYPE_DEFAULT = true;
/**
 * Default value for the files single match setting.
 */
exports.FILES_SINGLE_MATCH_DEFAULT = false;
/**
 * Default value for the cache setting.
 */
exports.CACHE_DEFAULT = true;
/**
 * Default value for the check-config setting.
 */
exports.CHECK_CONFIG_DEFAULT = false;
exports.RULE_EFFECT_ALLOW = "allow";
exports.RULE_EFFECT_DISALLOW = "disallow";
/**
 * Map containing the available rule effects.
 */
exports.RULE_EFFECTS_MAP = {
    ALLOW: exports.RULE_EFFECT_ALLOW,
    DISALLOW: exports.RULE_EFFECT_DISALLOW,
};
/** @deprecated Use `RULE_EFFECT_ALLOW` instead. */
exports.RULE_POLICY_ALLOW = exports.RULE_EFFECT_ALLOW;
/** @deprecated Use `RULE_EFFECT_DISALLOW` instead. */
exports.RULE_POLICY_DISALLOW = exports.RULE_EFFECT_DISALLOW;
/**
 * Map containing the available rule policies.
 * @deprecated Use `RULE_EFFECTS_MAP` instead.
 */
exports.RULE_POLICIES_MAP = exports.RULE_EFFECTS_MAP;
exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ALL = "all";
exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ELEMENT = "element";
exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_FILE = "file";
exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ANY = "any";
/**
 * Map containing the available values for the no-unknown-dependencies rule's
 * `require` option.
 */
exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP = {
    ALL: exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ALL,
    ELEMENT: exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ELEMENT,
    FILE: exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_FILE,
    ANY: exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_ANY,
};
exports.FROM = "from";
