"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
const node_path_1 = require("node:path");
const config_1 = require("@boundaries/config");
const Debug_1 = require("../Debug");
const Shared_1 = require("../Shared");
const { ENV_ROOT_PATH } = Shared_1.SETTINGS;
const trackedValidatedSettings = new WeakMap();
/**
 * Resolves the effective root path from the root-path setting and the environment variable.
 *
 * @param rootPath - Raw root-path setting value.
 * @returns Resolved absolute root path, and whether the environment variable holds a relative path that cannot be resolved because the setting is not set.
 */
function getNormalizedRootPath(rootPath) {
    const userSetting = rootPath && (0, Shared_1.isString)(rootPath) ? rootPath : undefined;
    const envRootPath = process.env[ENV_ROOT_PATH];
    const effectiveRootPath = envRootPath || userSetting;
    if (!effectiveRootPath) {
        return { rootPath: process.cwd(), isInvalid: false };
    }
    if ((0, node_path_1.isAbsolute)(effectiveRootPath)) {
        return { rootPath: effectiveRootPath, isInvalid: false };
    }
    if (!userSetting) {
        return { rootPath: process.cwd(), isInvalid: true };
    }
    return {
        rootPath: (0, node_path_1.resolve)(process.cwd(), effectiveRootPath),
        isInvalid: false,
    };
}
/**
 * Returns normalized and cached settings from ESLint rule context, printing the problems found in them.
 *
 * @param context - ESLint rule context.
 * @returns Normalized settings object used by rules.
 */
function getSettings(context) {
    const alreadyValidatedSettings = trackedValidatedSettings.get(context.settings);
    if (alreadyValidatedSettings) {
        return alreadyValidatedSettings;
    }
    const { rootPath, isInvalid: isInvalidRootPath } = getNormalizedRootPath(context.settings[Shared_1.SETTINGS_KEYS_MAP.ROOT_PATH]);
    const { value: settings, diagnostics } = (0, config_1.normalizeSettings)(context.settings, {
        rootPath,
    });
    (0, Debug_1.warnDiagnostics)(diagnostics);
    // After the settings warnings, in the order the plugin prints them
    if (isInvalidRootPath) {
        (0, Debug_1.warnOnce)(`Please provide a valid value in '${Shared_1.SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`, `The value should be a string. ${(0, config_1.moreInfoSettingsLink)()}`);
    }
    trackedValidatedSettings.set(context.settings, settings);
    return settings;
}
