# lint

`@howells/lint`: pinned Oxlint/Oxfmt, Ultracite and React Doctor presets, plus the `howells-*` bins. Docs are in `docs/` and `README.md`; specs and decisions live in Linear (howells, HOW).

```sh
pnpm lint
pnpm test
```

Releases: bump `package.json` and `CHANGELOG.md`, build the native binaries locally and publish a matching `vX.Y.Z` GitHub release with them attached; `release.yml` publishes to npm (see `docs/releasing.md`). Don't `npm publish` from a laptop.

Don't overwrite others' uncommitted work.
