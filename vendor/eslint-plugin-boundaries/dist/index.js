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
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const Recommended_1 = __importDefault(require("./Config/Recommended"));
const Strict_1 = __importDefault(require("./Config/Strict"));
const StrictLegacy_1 = __importDefault(require("./Config/StrictLegacy"));
const Dependencies_1 = __importDefault(require("./Rules/Dependencies"));
const EntryPoint_1 = __importDefault(require("./Rules/EntryPoint"));
const External_1 = __importDefault(require("./Rules/External"));
const NoIgnored_1 = __importDefault(require("./Rules/NoIgnored"));
const NoPrivate_1 = __importDefault(require("./Rules/NoPrivate"));
const NoUnknown_1 = __importDefault(require("./Rules/NoUnknown"));
const NoUnknownFiles_1 = __importDefault(require("./Rules/NoUnknownFiles"));
const Shared_1 = require("./Shared");
// import { warn } from "./Shared";
__exportStar(require("./Public"), exports);
/**
 * The path to the plugin package.json file
 */
const packageJsonPath = (0, node_path_1.join)(__dirname, "..", "package.json");
/**
 * The content of the package.json file
 */
const packageJson = JSON.parse((0, node_fs_1.readFileSync)(packageJsonPath, "utf-8"));
// TODO: Enable this warning in the next major release
/* if (packageJson.name !== "@boundaries/eslint-plugin") {
  warn(
    `⚠️  The "eslint-plugin-boundaries" package has been renamed to "@boundaries/eslint-plugin". Please install the new package, as this one will soon no longer receive updates`
  );
} */
const RULES = {
    [Shared_1.RULE_SHORT_NAMES_MAP.ENTRY_POINT]: EntryPoint_1.default,
    /** @deprecated Use dependencies rule instead */
    [Shared_1.RULE_SHORT_NAMES_MAP.ELEMENT_TYPES]: (0, Dependencies_1.default)(Shared_1.SETTINGS.RULE_ELEMENT_TYPES),
    [Shared_1.RULE_SHORT_NAMES_MAP.DEPENDENCIES]: (0, Dependencies_1.default)(),
    [Shared_1.RULE_SHORT_NAMES_MAP.EXTERNAL]: External_1.default,
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_IGNORED_DEPENDENCIES]: (0, NoIgnored_1.default)(),
    /** @deprecated Use no-ignored-dependencies rule instead */
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_IGNORED]: (0, NoIgnored_1.default)(Shared_1.SETTINGS.RULE_NO_IGNORED),
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_PRIVATE]: NoPrivate_1.default,
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES]: (0, NoUnknown_1.default)(),
    /** @deprecated Use no-unknown-dependencies rule instead */
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_UNKNOWN]: (0, NoUnknown_1.default)(Shared_1.SETTINGS.RULE_NO_UNKNOWN),
    [Shared_1.RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES]: NoUnknownFiles_1.default,
};
/**
 * Eslint plugin ensuring that architecture boundaries are respected by the elements in a project
 * It enables to check the folders and files structure and the dependencies and relationships between them.
 */
const publicInterface = {
    meta: {
        name: packageJson.name,
        version: packageJson.version,
    },
    rules: RULES,
    configs: {
        recommended: Recommended_1.default,
        strict: Strict_1.default,
        "strict-legacy": StrictLegacy_1.default,
    },
};
exports.default = publicInterface;
// For CommonJS compatibility
module.exports = {
    ...publicInterface,
};
