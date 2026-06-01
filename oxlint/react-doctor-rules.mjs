import {
	NEXTJS_RULES,
	RECOMMENDED_RULES,
} from "oxlint-plugin-react-doctor";

export const reactDoctorRecommendedRules = RECOMMENDED_RULES;
export const reactDoctorNextRules = NEXTJS_RULES;
export const reactDoctorRules = {
	...RECOMMENDED_RULES,
	...NEXTJS_RULES,
};
export const disabledReactDoctorRules = Object.fromEntries(
	Object.keys(reactDoctorRules).map((ruleName) => [ruleName, "allow"])
);
