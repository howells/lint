import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;
type OxlintSettings = NonNullable<OxlintConfig["settings"]>;
type OxlintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;

export const boundaryJsPlugins: OxlintJsPlugins;
export const boundarySettings: OxlintSettings;
export const boundaryRules: OxlintRules;

export function createNextFeatureBoundaryConfig(rootPath: string): OxlintConfig;

declare const config: OxlintConfig;
export default config;
