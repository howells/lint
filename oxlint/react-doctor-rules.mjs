import { NEXTJS_RULES, RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";
import ultraciteJsPlugins from "ultracite/oxlint/js-plugins";

export const reactDoctorRecommendedRules = RECOMMENDED_RULES;
export const reactDoctorNextRules = NEXTJS_RULES;
export const reactDoctorRules = {
  ...RECOMMENDED_RULES,
  ...NEXTJS_RULES,
};

// Disable every react-doctor rule reachable through the shared presets: the
// plugin's recommended sets plus whatever Ultracite's opt-in JS-plugin preset
// enables. Deriving from Ultracite keeps this escape hatch complete as its rule
// set evolves, rather than relying on the plugin's static exports.
const enabledReactDoctorRuleNames = new Set([
  ...Object.keys(reactDoctorRules),
  ...Object.keys(ultraciteJsPlugins.rules ?? {}).filter((ruleName) =>
    ruleName.startsWith("react-doctor/")
  ),
]);

export const disabledReactDoctorRules = Object.fromEntries(
  [...enabledReactDoctorRuleNames].map((ruleName) => [ruleName, "allow"])
);
