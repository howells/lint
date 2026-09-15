# Handoff: 3.2.5 release and the ESLint-removal rollout

Last updated 2026-09-15.

## Blocked on one browser step

3.2.5 is merged on `main` and tagged nowhere. It cannot publish until a
trusted publisher is registered on npmjs.com:

> `@howells/lint` → Settings → Trusted publisher → GitHub Actions,
> organisation `howells`, repository `lint`, workflow `release.yml`.

<https://www.npmjs.com/package/@howells/lint/access>

Nothing else is needed and nothing expires. After that, `git tag v3.2.5 && git
push origin v3.2.5` publishes. See the Releasing section of `AGENTS.md`.

The account is on `auth-and-writes` two-factor, so a local `npm publish` needs
an interactive confirmation. That is why 3.2.3 and 3.2.4 were tagged but never
reached the registry; their changes ship in 3.2.5. Registry `latest` is 3.2.2.

## Rollout state

Verified by installing a local `npm pack` of 3.2.5 into each repo, running
`pnpm lint`, then restoring the repo. Every repo below is clean on `main`.

| Repo | State |
| --- | --- |
| quarry | Green. Pin bump only. |
| motif | Green. Pin bump only. |
| samplize-scratch | Green. Pin bump only. |
| candor | Config landed on `main` (PR #24). Pin bump only now. |
| patternmode | Config verified, NOT landed. See below. |
| materialsinuse | Blocked until 2026-09-16 13:44 UTC. See below. |
| neon | Already on `^3.2.2`. Bump to `^3.2.5`. |
| colorscope | Excluded. Live owning session has declined to adopt. |

Every repo above is on `@howells/lint` 3.0.0 except neon, and that 3.0.0 pin is
the only source of ESLint in the fleet.

### patternmode

`apps/preview/oxlint.config.ts` needs a `settings.shadcn.mergeFunctions` entry
for its `joinClassNames` helper, and `shadcn/require-static-classes` scoped off
for `components/patternmode/**`, where every component is a forwarding wrapper
the rule cannot read through. Verified green on 3.2.5.

It cannot land before the pin bump: a config naming the `shadcn` plugin fails
to build on 3.0.0 with `Plugin 'shadcn' not found`, and the repo's pre-commit
hook correctly refuses it. The verified patch is at
`~/Sites/.pkg/lint-3.2.5-rollout/patternmode.patch`. Apply it in the same
commit as the pin bump.

### materialsinuse

`pnpm-workspace.yaml` sets `minimumReleaseAge: 10080`, a seven-day supply-chain
quarantine. `ultracite@7.11.1` was published 2026-09-09 13:44 UTC and clears at
2026-09-16 13:44 UTC. Until then the install fails with
`ERR_PNPM_NO_MATURE_MATCHING_VERSION`.

Wait for it rather than adding an exclude. The list already carries
`@howells/lint@3.0.0`, so the bump also needs `@howells/lint@3.2.5` added
there, consistent with existing practice.

## Not started

Tier 2 is the 19 repos on `@howells/lint` 2.x. Tier 3 is the 10 on 0.x/1.x,
which also crosses the Biome-lane removal in 2.0.0.

There is no `HOW` team in Linear, so this file is the record.
