import { NEXTJS_RULES, RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";
import ultraciteNext from "ultracite/oxlint/next";
import ultraciteReact from "ultracite/oxlint/react";

export const reactDoctorRecommendedRules = RECOMMENDED_RULES;
export const reactDoctorNextRules = NEXTJS_RULES;
export const reactDoctorRules = {
  ...RECOMMENDED_RULES,
  ...NEXTJS_RULES,
};

// Disable every react-doctor rule reachable through the shared presets: the
// plugin's recommended sets plus whatever Ultracite's React/Next presets enable
// directly. Deriving from Ultracite keeps this escape hatch complete as its
// rule set evolves, rather than relying on the plugin's static exports.
const enabledReactDoctorRuleNames = new Set([
  ...Object.keys(reactDoctorRules),
  ...Object.keys({ ...ultraciteReact.rules, ...ultraciteNext.rules }).filter((ruleName) =>
    ruleName.startsWith("react-doctor/"),
  ),
]);

export const disabledReactDoctorRules = Object.fromEntries(
  [...enabledReactDoctorRuleNames].map((ruleName) => [ruleName, "allow"]),
);
