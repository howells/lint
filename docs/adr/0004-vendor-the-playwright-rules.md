# Vendor the Playwright rules

Revises the ESLint paragraph of [0003](0003-remove-the-biome-lane.md).

ESLint is no longer installed. Oxlint and Oxfmt are the whole toolchain, and every rule runs inside Oxlint.

0003 kept ESLint as the runtime that `eslint-plugin-github`, `eslint-plugin-sonarjs` and `eslint-plugin-playwright` resolved against. 3.0.0 removed the first two. The third never used it: its bundle imports only `globals`, and Oxlint's JS-plugin bridge runs it without ESLint. The package still declares ESLint as a required peer, and pnpm installs required peers automatically, so every consumer carried an ESLint install that nothing executed. Declaring ESLint as an optional peer of this package does not stop that; measured, pnpm installed ESLint 10.10.0 into a fresh consumer regardless.

The plugin's MIT-licensed bundle is therefore copied into `vendor/eslint-plugin-playwright/` with its licence, and the Playwright preset loads it from there. All 36 rules keep running. `test/consumer-install.test.mjs` fails if ESLint appears in a packed install.

Two alternatives were rejected. Dropping the Playwright rules would remove checks such as `playwright/no-wait-for-timeout` and `playwright/no-force-option` from every E2E suite. Keeping the plugin as a dependency and upgrading ESLint to 10 would clear the peer warning but leave ESLint in every install.

The cost is that upstream fixes arrive only when someone refreshes the copy. `AGENTS.md` records the refresh steps. Ultracite ships no Playwright preset, so there is no upstream preset to move to instead.
