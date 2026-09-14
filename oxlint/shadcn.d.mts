import type { OxlintConfig } from "oxlint";

type OxlintRules = NonNullable<OxlintConfig["rules"]>;
type OxlintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;
type OxlintOverride = NonNullable<OxlintConfig["overrides"]>[number];

/**
 * The vendored `@shadcn/lint` plugin, resolved to an absolute specifier. The
 * React and Next presets already carry it, so a consumer on either only adds
 * rule entries.
 */
export const shadcnJsPlugins: OxlintJsPlugins;

/**
 * The rules the React and Next presets enable: `no-arbitrary-values` and
 * `require-static-classes`. Neither needs project configuration.
 */
export const shadcnRules: OxlintRules;

/**
 * The rules a consumer enables itself, because each one needs the project's own
 * design-system policy: `no-restyle`, `no-raw-colors`, `no-unknown-classes` and
 * `no-inline-styles`.
 */
export const designSystemRuleNames: string[];

/**
 * An Oxlint override that stops the call-site rules at the component directory,
 * so a component can style its own internals. `no-inline-styles` stays on, as
 * the plugin's documentation recommends.
 *
 * @param files - The component globs, e.g. `["components/ui/**\/*.tsx"]`.
 */
export function componentSourceOverride(files: string[]): OxlintOverride;

declare const config: OxlintConfig;

export default config;
