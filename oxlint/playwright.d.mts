import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;
type OxlintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;
type OxlintOverride = NonNullable<OxlintConfig["overrides"]>[number];
type OxlintPlugins = NonNullable<OxlintOverride["plugins"]>;

export const playwrightJsPlugins: OxlintJsPlugins;
export const playwrightRules: OxlintRules;

/**
 * The Vitest rules Ultracite scopes to test files, every one set to `"off"`.
 * Read out of Ultracite's preset, so an upstream addition is covered.
 */
export const vitestRulesOff: OxlintRules;

/**
 * `["vitest"]`. Must accompany {@link vitestRulesOff} wherever it is placed:
 * Oxlint discards a rule entry whose plugin is not in scope at that point, and
 * it does so without reporting anything.
 */
export const playwrightPlugins: OxlintPlugins;

/**
 * A complete Oxlint override for an app's Playwright lane: the Playwright
 * rules, the Vitest rules off, and the `vitest` plugin named so that the
 * second of those takes effect.
 *
 * @param files - The E2E globs to govern, e.g. `["e2e/**\/*.{ts,tsx}"]`.
 */
export function playwrightOverride(files: string[]): OxlintOverride;

declare const config: OxlintConfig;

export default config;
