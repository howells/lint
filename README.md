# `@howells/lint`

Pinned Oxlint/Oxfmt, Ultracite and React Doctor presets for Howells projects. One package pins every lint tool, and every consumer extends the same small preset matrix.

## Install

Requires Node 24.15.0+ and pnpm. Install only this package; `oxlint`, `oxfmt`, `oxlint-tsgolint`, `ultracite`, `oxlint-plugin-react-doctor` and `@manypkg/cli` are pinned transitively.

```bash
pnpm add -D @howells/lint
```

## Use

`oxlint.config.ts`, extending the closest preset (`core`, `react`, `next` or `playwright`):

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

`oxfmt.config.ts`:

```ts
export { default } from "@howells/lint/oxfmt";
```

Scripts:

```json
{
  "lint": "howells-check .",
  "lint:fix": "howells-fix ."
}
```

Monorepo roots use `turbo run lint && howells-workspace-check`. A repo with a backlog adds the ratchet: `"lint:ratchet": "howells-ratchet"` and `"lint:rebaseline": "howells-ratchet --write"`.

## Reference

These ship with the package:

- [Wiring a consumer repo](./docs/consumer-wiring.md)
- [Exports and presets](./docs/exports.md)
- [Lint ratchet](./docs/lint-ratchet.md)
- [GDP authorization proofs](./docs/gdp.md)
- [Migrations](./MIGRATIONS.md) and [changelog](./CHANGELOG.md)

The `howells-lint` agent skill walks an agent through setup:

```bash
npx skills@latest add howells/lint --skill howells-lint --global
```

## Developing

Documentation, specifications and outstanding work live in Linear (howells, HOW).

```sh
pnpm lint
pnpm test
pnpm prepush
```
