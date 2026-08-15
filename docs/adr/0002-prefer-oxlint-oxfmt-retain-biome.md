# Prefer Oxlint/Oxfmt and retain Biome

**Superseded by [0003](0003-remove-the-biome-lane.md) in 2.0.0.** Kept for the reasoning, not as current policy.

Oxlint/Oxfmt is the preferred lane for new Howells JavaScript and TypeScript projects because it supports the extended Ultracite philosophy: start from Ultracite, then add narrow Howells policy for recurring correctness, React, testing, and architecture failures. The Biome lane remains supported as a frozen compatibility path for existing projects and projects that are not ready to adopt Oxlint/Oxfmt: it receives dependency, breakage, and ecosystem-compatibility updates, but new shared policy work should target Oxlint/Oxfmt first unless there is a strong reason to support both lanes.
