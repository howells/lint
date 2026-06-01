import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;

export const reactDoctorRecommendedRules: OxlintRules;
export const reactDoctorNextRules: OxlintRules;
export const reactDoctorRules: OxlintRules;
export const disabledReactDoctorRules: OxlintRules;
