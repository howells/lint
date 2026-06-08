# Prefer Oxlint/Oxfmt and retain Biome

Oxlint/Oxfmt is the preferred lane for new Howells JavaScript and TypeScript projects because it supports the extended Ultracite philosophy: start from Ultracite, then add narrow Howells policy for recurring correctness, React, testing, and architecture failures. The Biome lane remains supported as a compatibility path for existing projects and projects that are not ready to adopt Oxlint/Oxfmt, but new shared policy work should target Oxlint/Oxfmt first unless there is a strong reason to support both lanes.
