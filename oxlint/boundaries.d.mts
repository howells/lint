import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;
type OxlintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;

export const howellsJsPlugins: OxlintJsPlugins;
export const boundaryRules: OxlintRules;

export function createNextFeatureBoundaryConfig(rootPath: string): OxlintConfig;

declare const config: OxlintConfig;
export default config;
