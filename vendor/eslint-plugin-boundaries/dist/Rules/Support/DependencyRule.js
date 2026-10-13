"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyRule = dependencyRule;
const Debug_1 = require("../../Debug");
const Elements_1 = require("../../Elements");
const Settings_1 = require("../../Settings");
const Shared_1 = require("../../Shared");
const Helpers_1 = require("./Helpers");
const { ADDITIONAL_DEPENDENCY_NODES } = Shared_1.SETTINGS;
/**
 * Creates a rule module that evaluates dependency nodes using shared matcher logic.
 *
 * @param ruleMeta - Metadata used to build ESLint rule `meta` information.
 * @param rule - Rule runner invoked for each described dependency.
 * @param ruleOptions - Optional behavior flags for validation and rule shape.
 * @returns ESLint rule module ready to be exported by concrete rules.
 */
function dependencyRule(ruleMeta, rule, ruleOptions = {}) {
    return {
        ...(0, Helpers_1.meta)(ruleMeta),
        create: function (context) {
            const options = context.options[0];
            const settings = (0, Settings_1.getSettings)(context);
            const entity = (0, Elements_1.entityDescription)(context.filename, settings);
            if (ruleOptions.validate !== false && !options) {
                return {};
            }
            if (entity.file.isIgnored ||
                (entity.file.isUnknown && entity.element.isUnknown)) {
                return {};
            }
            return settings.dependencyNodes.reduce((visitors, { selector, kind, name }) => {
                visitors[selector] = (node) => {
                    /* istanbul ignore next - Defensive check */
                    if (!(0, Shared_1.isString)(node.value)) {
                        (0, Debug_1.warnOnce)(`Dependency node value is not a string, skipping node.`, `Please check your ${ADDITIONAL_DEPENDENCY_NODES} setting. ${(0, Settings_1.moreInfoSettingsLink)()}`);
                        return;
                    }
                    const dependency = (0, Elements_1.dependencyDescription)({
                        node,
                        kind,
                        nodeKind: name,
                    }, context.filename, settings, context);
                    rule({ dependency, options, node, context, settings });
                };
                return visitors;
            }, {});
        },
    };
}
