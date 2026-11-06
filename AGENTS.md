# lint

`@howells/lint`: pinned Oxlint/Oxfmt, Ultracite and React Doctor presets, plus the `howells-*` bins. Docs are in `docs/` and `README.md`.

```sh
pnpm lint
pnpm test
```

Releases: bump `package.json` and `CHANGELOG.md`, build the native binaries locally and publish a matching `vX.Y.Z` GitHub release with them attached; `release.yml` publishes to npm (see `docs/releasing.md`). Don't `npm publish` from a laptop.

Don't overwrite others' uncommitted work.

## Agent skills

### Issue tracker

Issues live in Linear (howells, HOW). See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
