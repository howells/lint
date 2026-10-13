"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docsUrl = docsUrl;
exports.getRuleDocsPath = getRuleDocsPath;
exports.ruleDocsUrl = ruleDocsUrl;
exports.moreInfoLink = moreInfoLink;
exports.migrationGuideLink = migrationGuideLink;
exports.migrationToV6GuideLink = migrationToV6GuideLink;
exports.migrationToV2GuideLink = migrationToV2GuideLink;
exports.migrationToV7GuideLink = migrationToV7GuideLink;
exports.moreInfoSettingsLink = moreInfoSettingsLink;
exports.moreInfoElementsLink = moreInfoElementsLink;
exports.moreInfoLegacySettingsLink = moreInfoLegacySettingsLink;
exports.moreInfoSelectorsLink = moreInfoSelectorsLink;
exports.deprecatedRuleInfo = deprecatedRuleInfo;
const Settings_types_1 = require("../Shared/Settings.types");
/**
 * Removes the plugin namespace from a rule name.
 * @param ruleName The name of the rule.
 * @returns The rule name without the plugin namespace.
 */
function removePluginNamespace(ruleName) {
    return ruleName.replace(`${Settings_types_1.PLUGIN_NAME}/`, "");
}
/**
 * Adapts the rule name to be used in a URL.
 * @param ruleName The name of the rule.
 * @returns The adapted rule name for URL usage.
 */
function adaptRuleNameToUrl(ruleName) {
    if (ruleName === Settings_types_1.RULE_NAMES_MAP.ELEMENT_TYPES) {
        return Settings_types_1.RULE_NAMES_MAP.DEPENDENCIES;
    }
    if (ruleName === Settings_types_1.RULE_NAMES_MAP.NO_IGNORED) {
        return Settings_types_1.RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES;
    }
    if (ruleName === Settings_types_1.RULE_NAMES_MAP.NO_UNKNOWN) {
        return Settings_types_1.RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES;
    }
    return ruleName;
}
/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns The documentation URL for the ESLint rule.
 */
function docsUrl(path, anchor) {
    const anchorSuffix = anchor ? `#${anchor}` : "";
    return `${Settings_types_1.WEBSITE_URL}/docs/${path}/${anchorSuffix}`;
}
/**
 * Returns the documentation path for a given rule name.
 * @param ruleName The name of the rule.
 * @returns The documentation path for the given rule name.
 */
function getRuleDocsPath(ruleName) {
    return `rules/${removePluginNamespace(adaptRuleNameToUrl(ruleName))}`;
}
/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns The documentation URL for the ESLint rule.
 */
function ruleDocsUrl(ruleName, anchor) {
    return docsUrl(getRuleDocsPath(ruleName), anchor);
}
/**
 * Returns a "more info" message with the documentation URL for a given path.
 * @param path The path to the documentation page.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns A message containing the documentation URL.
 */
function moreInfoLink(path, anchor) {
    return `More info: ${docsUrl(path, anchor)}`;
}
/**
 * Returns a migration guide link for a specific version upgrade.
 * @param versionFrom - The version being upgraded from.
 * @param versionTo - The version being upgraded to.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for the specified version upgrade.
 */
function migrationGuideLink(versionFrom, versionTo, anchor) {
    return moreInfoLink(`releases/migration-guides/v${versionFrom}-to-v${versionTo}`, anchor);
}
/**
 * Returns a migration guide link for upgrading from version 5 to version 6.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for upgrading from version 5 to version 6.
 */
function migrationToV6GuideLink(anchor) {
    return migrationGuideLink("5", "6", anchor);
}
/**
 * Returns a migration guide link for upgrading from version 1 to version 2.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for upgrading from version 1 to version 2.
 */
function migrationToV2GuideLink(anchor) {
    return migrationGuideLink("1", "2", anchor);
}
/**
 * Returns a migration guide link for upgrading from version 6 to version 7.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for upgrading from version 6 to version 7.
 */
function migrationToV7GuideLink(anchor) {
    return migrationGuideLink("6", "7", anchor);
}
/**
 * Returns a settings information link for the plugin settings documentation.
 * @param anchor - Optional anchor to a specific section in the settings documentation.
 * @returns A message containing the settings information URL for the plugin settings documentation.
 */
function moreInfoSettingsLink(anchor) {
    return moreInfoLink(`settings`, anchor);
}
/**
 * Returns a "more info" message linking to the element descriptors documentation page.
 * @param anchor - Optional anchor to a specific section in the documentation page.
 * @returns A message containing the elements documentation URL.
 */
function moreInfoElementsLink(anchor) {
    return moreInfoLink("classification/elements", anchor);
}
/**
 * Returns a "more info" message linking to the legacy settings documentation page.
 * @param anchor - Optional anchor to a specific section in the documentation page.
 * @returns A message containing the legacy settings documentation URL.
 */
function moreInfoLegacySettingsLink(anchor) {
    return moreInfoLink("settings/legacy", anchor);
}
/**
 * Returns a "more info" message linking to the entity selectors documentation page.
 * @param anchor - Optional anchor to a specific section in the documentation page.
 * @returns A message containing the entity selectors documentation URL.
 */
function moreInfoSelectorsLink(anchor) {
    return moreInfoLink("selectors/element", anchor);
}
/**
 * Builds the ESLint `meta.deprecated` info object for a rule replaced by another rule name
 * (e.g. a rename), so editors/tools can surface the deprecation without relying on the
 * runtime `warnOnce` message.
 * @param replacedByRuleName - The rule name that replaces the deprecated one.
 * @returns The `deprecated` metadata object consumed by ESLint's rule `meta`.
 */
function deprecatedRuleInfo(replacedByRuleName) {
    return {
        message: `Use "${replacedByRuleName}" instead.`,
        url: ruleDocsUrl(replacedByRuleName),
        replacedBy: [
            {
                rule: {
                    name: replacedByRuleName,
                    url: ruleDocsUrl(replacedByRuleName),
                },
            },
        ],
    };
}
