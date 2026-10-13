"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLegacy = exports.strict = exports.recommended = void 0;
exports.createConfig = createConfig;
const index_1 = __importDefault(require("../index"));
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Recommended_1 = __importDefault(require("./Recommended"));
const Strict_1 = __importDefault(require("./Strict"));
const StrictLegacy_1 = __importDefault(require("./StrictLegacy"));
__exportStar(require("../Public"), exports);
/**
 * Rewrites rule keys to the effective plugin namespace used by `createConfig`.
 *
 * It accepts rules prefixed either with the default plugin name (`boundaries`)
 * or with the custom plugin name passed to `createConfig`.
 *
 * @param pluginName - Plugin namespace to enforce in output rule keys.
 * @param rules - Input rule entries from the user config.
 * @returns Rules object normalized to the requested plugin namespace.
 */
function renamePluginRules(pluginName, rules) {
    if (!rules) {
        return {};
    }
    const allowedPrefixes = new Set([Shared_1.PLUGIN_NAME, pluginName]);
    // Return the same rules objects, but converting plugin default rule keys with provided plugin name
    return Object.entries(rules).reduce((acc, [key, value]) => {
        if (!key.includes("/")) {
            throw new Error(`Invalid rule key "${key}". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "${Shared_1.PLUGIN_NAME}/", or with the provided plugin name "${pluginName}/".`);
        }
        const splittedRuleKey = key.split("/");
        const rulePrefix = splittedRuleKey[0];
        const ruleName = splittedRuleKey[1];
        if (!allowedPrefixes.has(rulePrefix)) {
            throw new Error(`Invalid rule key "${key}". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "${Shared_1.PLUGIN_NAME}/", or with the provided plugin name "${pluginName}/".`);
        }
        if (!(0, Settings_1.isRuleShortName)(ruleName)) {
            throw new Error(`Invalid rule name "${ruleName}". When using createConfig, all rules must belong to eslint-plugin-boundaries.`);
        }
        let newKey;
        if (rulePrefix === Shared_1.PLUGIN_NAME) {
            const suffix = key.slice(Shared_1.PLUGIN_NAME.length + 1);
            newKey = `${pluginName}/${suffix}`;
        }
        else {
            newKey = key;
        }
        acc[newKey] = value;
        return acc;
    }, {});
}
/**
 * Returns an ESLint config object with the boundaries plugin registered, providing default JS and TS file patterns
 * and enforcing valid types for settings and rules. Supports renaming the plugin. Rules can be prefixed with either
 * the original plugin name or the provided plugin name.
 *
 * @param config - ESLint config object without the plugins field.
 * @param name - The name of the plugin to register. Defaults to "boundaries".
 * @returns {ConfigObject} The ESLint config object with the boundaries plugin registered and the provided config merged in.
 * @throws {Error} If settings or rules are not from eslint-plugin-boundaries.
 *
 * @example
 * ```ts
 * import { createConfig, recommended } from "eslint-plugin-boundaries/config";
 *
 * const config = createConfig({
 *   settings: {
 *     ...recommended.settings,
 *     "boundaries/elements": [],
 *     "boundaries/ignore": ["ignored/*.js"],
 *   },
 *   rules: {
 *     ...recommended.rules,
 *     "boundaries/dependencies": ["error", { default: "disallow" }],
 *   }
 * });
 *
 * export default [config];
 * ```
 */
function createConfig(config, name = Shared_1.PLUGIN_NAME) {
    // Annotate plugins as Record<string, object> to prevent TypeScript from inferring
    // the internal plugin type, which would expose ESLint internal generic types
    const pluginsRegistration = {
        [name]: index_1.default,
    };
    if (Object.hasOwn(config, "plugins")) {
        throw new Error("The 'plugins' field is managed by createConfig and should not be provided in the config argument.");
    }
    if (Object.hasOwn(config, "settings")) {
        const settings = config.settings;
        if (settings) {
            for (const key of Object.keys(settings)) {
                if (!(0, Settings_1.isSettingsKey)(key)) {
                    throw new Error(`Invalid settings key "${key}". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.`);
                }
            }
        }
    }
    return {
        files: [
            "**/*.js",
            "**/*.jsx",
            "**/*.ts",
            "**/*.tsx",
            "**/*.mjs",
            "**/*.cjs",
        ],
        ...config,
        plugins: pluginsRegistration,
        rules: renamePluginRules(name, config.rules),
    };
}
exports.recommended = Recommended_1.default;
exports.strict = Strict_1.default;
exports.strictLegacy = StrictLegacy_1.default;
