import { NEXTJS_RULES, RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";

import {
  ultraciteNextReactDoctor,
  ultraciteReactDoctor,
} from "./ultracite-js-plugins.mjs";

export const reactDoctorRecommendedRules = RECOMMENDED_RULES;
export const reactDoctorNextRules = NEXTJS_RULES;
export const reactDoctorRules = {
  ...RECOMMENDED_RULES,
  ...NEXTJS_RULES,
};

// Disable every react-doctor rule reachable through the shared presets: the
// plugin's recommended sets plus whatever the Howells React and Next presets
// enable. Deriving from those presets rather than from the plugin's static
// exports keeps this escape hatch complete as Ultracite moves rules between its
// JS-plugin presets — as 7.10.0 did when it split the Next.js rules out.
const enabledReactDoctorRuleNames = new Set(
  [
    ...Object.keys(reactDoctorRules),
    ...Object.keys(ultraciteReactDoctor.rules ?? {}),
    ...Object.keys(ultraciteNextReactDoctor.rules ?? {}),
  ].filter((ruleName) => ruleName.startsWith("react-doctor/"))
);

export const disabledReactDoctorRules = Object.fromEntries(
  [...enabledReactDoctorRuleNames].map((ruleName) => [ruleName, "allow"])
);
