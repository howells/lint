# lint

`@howells/lint`: pinned Oxlint/Oxfmt, Ultracite and React Doctor presets, plus the `howells-*` bins. Docs are in `docs/` and `README.md`; specs and decisions live in Linear (howells, HOW).

```sh
pnpm lint
pnpm test
```

Releases: bump `package.json` and `CHANGELOG.md`, push a matching `vX.Y.Z` tag; `release.yml` publishes (see `docs/releasing.md`). Don't publish from a laptop.

Don't overwrite others' uncommitted work.
