# GDP authorization proofs

Core, React, Next and standalone Playwright enable [Ultracite's GDP preset](https://www.ultracite.ai/docs/presets#authorization-proofs-with-gdp-ts) by default. [GDP](https://github.com/rauchg/gdp-ts) stands for Ghosts of Departed Proofs: a permission check produces a typed proof, and a sensitive function requires that proof for its exact named arguments. Type checking catches calls with missing or mismatched proofs; the lint rules catch attempts to forge one.

## Default lint coverage

The lint plugin is already pinned by `@howells/lint`. Your normal preset is sufficient:

```ts
import core from "@howells/lint/oxlint/core";

export default {
  extends: [core],
};
```

Use `react`, `next` or `playwright` instead of `core` in those projects. Name the config `oxlint.config.ts` in an ES module package, or `oxlint.config.mts` otherwise. The standalone `@howells/lint/oxlint/gdp` export provides the same GDP rules for custom configurations that do not extend a standard preset.

The strict assertion rules apply even to projects that do not use the proof library. Run the normal `howells-check` after upgrading and see [the migration notes](../MIGRATIONS.md#gdp-rules-are-enabled-by-default) for existing casts.

## Adopt authorization proofs in application code

Install the library as an application dependency in the package that uses its runtime API:

```sh
pnpm add @gdp-ts/core@0.1.0
```

The lint preset does not add permission checks to application code. Adopt the library's [recipe](https://github.com/rauchg/gdp-ts/blob/main/skills/gdp-ts/references/recipe.md) on a sensitive operation: name the user and resource, check permission in a trusted module, and require the resulting proof in the function that performs the operation. Keep the actual authorization check against your application's data, and run your TypeScript check alongside `howells-check`.

## Rules and trusted modules

The preset follows Ultracite's strict mode:

- Outside `proofs/`, importing or calling `defineProof` is an error.
- Outside `proofs/`, asserting a value to `Named`, `Proof`, or a type imported from a `proofs` path is an error.
- Outside `proofs/` and `lib/ids.ts`, every other type assertion except `as const` is an error too.
- Inside `proofs/`, the prover must remain private. Export the proof interface and the function that performs the permission check.

Trusted modules may declare empty proof interfaces that extend `Proof`. Give the prover a different name from the interface, such as `const prover = defineProof("UserIsProjectAdmin")`, to satisfy core's `no-redeclare` rule. The `lib/ids.ts` exception permits branded-ID assertions; it does not permit forged proofs or proof creation.

Use these directory names when following the recipe. If an application uses a different layout, adapt the matching overrides and proof-import patterns in its own config. Other core rules, including anti-slop's safety-comment requirements, still apply in trusted modules.
