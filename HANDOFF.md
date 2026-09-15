# Handoff: 3.2.5 release and the ESLint-removal rollout

Last updated 2026-09-15.

## Releasing works now

3.2.5 is on npm with provenance, published by `.github/workflows/release.yml` from a pushed `v3.2.5` tag. Authentication is npm Trusted Publishing, so there is no token anywhere and the account keeps `auth-and-writes` two-factor. See the Releasing section of `AGENTS.md`. 3.2.3 and 3.2.4 were tagged but never reached the registry; their changes ship in 3.2.5.

## Publishing the other packages

The colorscope session is rolling one npm-publishing standard across roughly 17 repos. Lint's workflow now matches what it proposed: pack with `pnpm pack` and publish the tarball, with access declared in `publishConfig` rather than a flag. Publishing a directory ships pnpm's `catalog:` and `workspace:` specifiers unexpanded and produces an uninstallable tarball, which has already reached the registry once from another repo.

The gating item for that rollout is not the workflow file. Each package needs a one-time trusted publisher registered in the npmjs.com web UI, naming the organisation, repository and the exact workflow filename. Seventeen packages means seventeen registrations, each needing a browser, and the page sits behind a Cloudflare challenge that an agent cannot clear.

`@howells/neon` is the proof. Its release workflow has run once, on `v0.1.3`, and failed with `404 PUT https://registry.npmjs.org/@howells%2fneon`: the token was minted but carried no publish rights, because no trusted publisher is registered for that package. All five published versions of it were pushed by hand, which is why none carries provenance.

## Rollout state

Seven of eight repos are on 3.2.5 with no `eslint` entry in their lockfile. Each was verified with `pnpm lint` and `pnpm typecheck` before merge.

| Repo             | State                                                |
| ---------------- | ---------------------------------------------------- |
| quarry           | Merged, PR 39.                                       |
| motif            | Merged, PR 5. Also collapsed a zod split; see below. |
| samplize-scratch | Merged, PR 73.                                       |
| candor           | Merged, PRs 24 and 25.                               |
| patternmode      | Merged, PR 9.                                        |
| neon             | Merged, PR 3.                                        |
| materialsinuse   | Blocked until 2026-09-16 13:44 UTC. See below.       |
| colorscope       | Excluded. Live owning session has declined to adopt. |

### materialsinuse is the only one left

`pnpm-workspace.yaml` sets `minimumReleaseAge: 10080`, a seven-day supply-chain quarantine. `ultracite@7.11.1` was published 2026-09-09 13:44 UTC and clears at 2026-09-16 13:44 UTC. Until then the install fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`.

The prepared change is at `~/Sites/.pkg/lint-3.2.5-rollout/materialsinuse.patch`. It bumps the catalog pin and adds `@howells/lint@3.2.5` to `minimumReleaseAgeExclude`, matching the `@howells/lint@3.0.0` entry already there. Do not add `ultracite` to that list: it is third party and the quarantine is aimed at exactly that. Wait, apply the patch, install, lint, typecheck, ship.

### The zod split in motif

Regenerating motif's lockfile resolved zod two ways, which gave two copies of `drizzle-orm@1.0.0-rc.4` under different peer sets. Their types are structurally incompatible and `@motif/bench-web` failed to typecheck with `Type 'SQL<unknown>' is not assignable to type 'SQL<unknown>'` naming two paths under `node_modules/.pnpm`. Resolving zod once collapsed it. All five packages already declared `^4.4.3`, so nothing widened.

Any repo here whose lockfile is regenerated can hit the same shape. Run `pnpm typecheck` after a dependency bump, not only `pnpm lint`.

### Superseded ref

`neon` carries a local branch `superseded/lint-3.2.2-local` at `5873287`, an unpushed 3.2.2 bump that PR 3 supersedes. Delete it once you are happy.

## Not started

Tier 2 is the 19 repos on `@howells/lint` 2.x. Tier 3 is the 10 on 0.x/1.x, which also crosses the Biome-lane removal in 2.0.0.

There is no `HOW` team in Linear, so this file is the record.
