import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;
type OxlintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;

export const playwrightJsPlugins: OxlintJsPlugins;
export const playwrightRules: OxlintRules;

declare const config: OxlintConfig;

export default config;
