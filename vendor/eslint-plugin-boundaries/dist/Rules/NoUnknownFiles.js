"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Elements_1 = require("../Elements");
const Settings_1 = require("../Settings");
const Shared_1 = require("../Shared");
const Support_1 = require("./Support");
const { RULE_NO_UNKNOWN_FILES } = Shared_1.SETTINGS;
const noUnknownFilesRule = {
    ...(0, Support_1.meta)({
        ruleName: RULE_NO_UNKNOWN_FILES,
        schema: [],
        description: `Prevent creating files not recognized by any element or file patterns`,
    }),
    create: function (context) {
        const settings = (0, Settings_1.getSettings)(context);
        const entity = (0, Elements_1.entityDescription)(context.filename, settings);
        if (entity.file.isIgnored ||
            !entity.file.isUnknown ||
            !entity.element.isUnknown) {
            return {};
        }
        return {
            Program: (node) => {
                context.report({
                    message: `File does not match any file pattern and does not belong to any known element`,
                    node: node,
                });
            },
        };
    },
};
exports.default = noUnknownFilesRule;
