# Releasing

Pushing a `vX.Y.Z` tag publishes that version. `.github/workflows/release.yml` runs `pnpm check` and then `npm publish`, authenticating through npm trusted publishing: GitHub mints a short-lived OIDC token scoped to this repository and this workflow file, and npm exchanges it for publish rights. No token is stored in the repository or on any machine, and the account keeps `auth-and-writes` two-factor.

```sh
# on main, with the version already bumped and merged
git tag v3.2.5 && git push origin v3.2.5
```

The job packs with `pnpm pack` and publishes the resulting tarball rather than the directory. npm doesn't understand pnpm's `catalog:` and `workspace:` specifiers, so publishing a directory from a workspace that uses them ships them unexpanded and produces a tarball nobody can install. This package has no such specifier and the packed file list is identical either way, so it costs nothing and keeps the shape correct.

Access comes from `publishConfig` in `package.json`, not a flag in the workflow.

The job fails when the tag and `package.json` disagree, so the tag is the only thing worth double-checking. Published tarballs carry provenance, linking each version on npmjs.com back to the commit and workflow run that built it.

Don't publish from a laptop. A local `npm publish` needs an interactive two-factor confirmation, produces no provenance, and leaves the registry with a version that has no run behind it.

Renaming this workflow file, or moving the repository, breaks publishing until the trusted publisher entry on npmjs.com is updated to match.
