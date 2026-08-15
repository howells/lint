# Remove the Biome lane

Supersedes [0002](0002-prefer-oxlint-oxfmt-retain-biome.md).

2.0.0 removes the Biome presets, the `howells-biome` binary, and the `@biomejs/biome` dependency. Oxlint/Oxfmt is the whole toolchain.

A frozen lane is only worth its carrying cost while it carries something. At the point of removal, seven repositories held a `biome.json` extending `@howells/lint/biome/*`, but only two still ran Biome from a `lint` script: `materia` (43 packages) and `wiredeck` (1). The other five had migrated their scripts to `howells-check` and left the config behind. The lane was therefore paying for three preset files, a binary, and a pinned dependency in order to serve two consumers, neither of which was tracking releases.

Removal is safe because a consumer only takes a new version when it asks for one. `materia` pins `^0.5.0` through its catalog and has not seen a 1.x release. `wiredeck` pins `^1.2.0`, which a minor would have reached — so the removal ships as a major. Neither repository crosses 2.0.0 without a deliberate bump, and 1.x keeps working for as long as they stay on it.

The alternative — deprecate now, delete later — was rejected. It keeps the code, the dependency, and the two-lane language in `CONTEXT.md` alive for another cycle without changing what any consumer does, because neither consumer would read the deprecation.

ESLint stays, and is not a lane. `eslint-plugin-github`, `eslint-plugin-sonarjs`, and `eslint-plugin-playwright` run inside Oxlint through its JS-plugin bridge and account for 188 of the core preset's enabled rules plus all 36 in the Playwright preset. The pinned `eslint` dependency is the runtime those plugins resolve against, and pinning it is what holds the bridge at a working version. Removing it would delete a quarter of every preset to save nothing.
