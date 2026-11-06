# 0004. Vendor the Playwright rules

The MIT-licensed bundle of `eslint-plugin-playwright` is copied into `vendor/eslint-plugin-playwright/` with its licence, and the Playwright preset loads it from there. ESLint is not installed at all; Oxlint and Oxfmt are the whole toolchain.

The plugin's bundle imports only `globals`, and Oxlint's JS-plugin bridge runs it without ESLint. But the package declares ESLint as a required peer, pnpm installs required peers, and making it optional did not stop that, so every consumer carried an ESLint install that nothing executed. Dropping the Playwright rules would lose checks such as `playwright/no-wait-for-timeout` in every E2E suite, and upgrading ESLint would leave it in every install.

Consequence: upstream fixes arrive only when someone refreshes the copy (steps in `docs/internals.md`). `test/consumer-install.test.mjs` fails if ESLint appears in a packed install.
