"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS = exports.PLUGIN_ENV_VARS_PREFIX = exports.SETTINGS_KEYS_MAP = exports.RULE_SHORT_NAMES_MAP = exports.RULE_NAMES_MAP = exports.PLUGIN_NAME = exports.PLUGIN_ISSUES_URL = exports.NO_UNKNOWN_FILES = exports.NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP = exports.NO_UNKNOWN_DEPENDENCIES = exports.NO_UNKNOWN = exports.NO_PRIVATE = exports.NO_IGNORED_DEPENDENCIES = exports.NO_IGNORED = exports.EXTERNAL = exports.ENTRY_POINT = exports.ELEMENT_TYPES = exports.DEPENDENCIES = void 0;
const config_1 = require("@boundaries/config");
var config_2 = require("@boundaries/config");
Object.defineProperty(exports, "DEPENDENCIES", { enumerable: true, get: function () { return config_2.DEPENDENCIES; } });
Object.defineProperty(exports, "ELEMENT_TYPES", { enumerable: true, get: function () { return config_2.ELEMENT_TYPES; } });
Object.defineProperty(exports, "ENTRY_POINT", { enumerable: true, get: function () { return config_2.ENTRY_POINT; } });
Object.defineProperty(exports, "EXTERNAL", { enumerable: true, get: function () { return config_2.EXTERNAL; } });
Object.defineProperty(exports, "NO_IGNORED", { enumerable: true, get: function () { return config_2.NO_IGNORED; } });
Object.defineProperty(exports, "NO_IGNORED_DEPENDENCIES", { enumerable: true, get: function () { return config_2.NO_IGNORED_DEPENDENCIES; } });
Object.defineProperty(exports, "NO_PRIVATE", { enumerable: true, get: function () { return config_2.NO_PRIVATE; } });
Object.defineProperty(exports, "NO_UNKNOWN", { enumerable: true, get: function () { return config_2.NO_UNKNOWN; } });
Object.defineProperty(exports, "NO_UNKNOWN_DEPENDENCIES", { enumerable: true, get: function () { return config_2.NO_UNKNOWN_DEPENDENCIES; } });
Object.defineProperty(exports, "NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP", { enumerable: true, get: function () { return config_2.NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP; } });
Object.defineProperty(exports, "NO_UNKNOWN_FILES", { enumerable: true, get: function () { return config_2.NO_UNKNOWN_FILES; } });
Object.defineProperty(exports, "PLUGIN_ISSUES_URL", { enumerable: true, get: function () { return config_2.PLUGIN_ISSUES_URL; } });
Object.defineProperty(exports, "PLUGIN_NAME", { enumerable: true, get: function () { return config_2.PLUGIN_NAME; } });
Object.defineProperty(exports, "RULE_NAMES_MAP", { enumerable: true, get: function () { return config_2.RULE_NAMES_MAP; } });
Object.defineProperty(exports, "RULE_SHORT_NAMES_MAP", { enumerable: true, get: function () { return config_2.RULE_SHORT_NAMES_MAP; } });
Object.defineProperty(exports, "SETTINGS_KEYS_MAP", { enumerable: true, get: function () { return config_2.SETTINGS_KEYS_MAP; } });
exports.PLUGIN_ENV_VARS_PREFIX = "ESLINT_PLUGIN_BOUNDARIES";
/**
 * Setting keys and rule names of `@boundaries/config`, plus the environment variables that the plugin reads.
 */
exports.SETTINGS = {
    ...config_1.SETTINGS,
    // env vars
    DEBUG: `${exports.PLUGIN_ENV_VARS_PREFIX}_DEBUG`,
    ENV_ROOT_PATH: `${exports.PLUGIN_ENV_VARS_PREFIX}_ROOT_PATH`,
};
