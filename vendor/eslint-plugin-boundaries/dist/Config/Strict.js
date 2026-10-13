"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shared_1 = require("../Shared");
const Recommended_1 = __importDefault(require("./Recommended"));
const { RULE_NO_IGNORED_DEPENDENCIES, RULE_NO_UNKNOWN_FILES, RULE_NO_UNKNOWN_DEPENDENCIES, } = Shared_1.SETTINGS;
// TODO In next major version: Export also files, plugin, etc.
/**
 * Strict configuration for eslint-plugin-boundaries.
 *
 * It enables all rules, enforcing full compliance with defined boundaries. Unknown files and importing ignored files are not allowed.
 */
const config = {
    ...Recommended_1.default,
    rules: {
        ...Recommended_1.default.rules,
        [RULE_NO_IGNORED_DEPENDENCIES]: 2,
        [RULE_NO_UNKNOWN_FILES]: 2,
        [RULE_NO_UNKNOWN_DEPENDENCIES]: 2,
    },
};
exports.default = config;
// For CommonJS compatibility
module.exports = config;
