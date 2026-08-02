# 0001. Stack Ultracite and React Doctor on the Oxlint/Oxfmt Lane

## Status

Accepted

## Context

`@howells/lint` offers separate linting lanes. Projects choose the Biome lane or the Oxlint/Oxfmt lane; they do not run both indefinitely.

For React and Next.js projects on the Oxlint/Oxfmt lane, there are two useful rule sources:

- Ultracite's Oxlint presets, which provide broad JavaScript, TypeScript, React, accessibility, and framework rules.
- React Doctor's Oxlint plugin, which adds deeper React-specific rules for state, effects, architecture, performance, server boundaries, and framework behavior.

Some React Doctor rules overlap with Ultracite's React and accessibility rules. Filtering duplicates would reduce repeated diagnostics, but it would also require `@howells/lint` to maintain a reconciliation layer that could drift as either upstream package changes.

## Decision

For React and Next.js projects on the Oxlint/Oxfmt lane, stack the relevant Ultracite Oxlint presets with React Doctor rules in one preset:

- `@howells/lint/oxlint/react` extends `ultracite/oxlint/core` and `ultracite/oxlint/react`. Ultracite's React preset registers `oxlint-plugin-react-doctor` and enables its rules, so this preset only adds Howells naming policy on top.
- `@howells/lint/oxlint/next` extends the React preset and `ultracite/oxlint/next`, which supplies the React Doctor Next.js rules; this preset only adds the Howells page policy.

Do not filter overlapping rules by default.

## Consequences

Consumers get one Oxlint/Oxfmt lane preset for React and Next.js projects, with both Ultracite coverage and React Doctor coverage.

Some findings may be duplicate or near-duplicate when upstream rule sets overlap. This is acceptable because coverage is preferred over maintaining a local rule reconciliation matrix.

## Update — 1.2.0

The decision stands; the mechanism has moved twice. Ultracite's React and Next presets no longer register `oxlint-plugin-react-doctor` themselves. Ultracite 7.9.3 moved React Doctor into an opt-in JS-plugin preset, and 7.10.0 split its framework rules out again into per-framework JS-plugin presets. `@howells/lint` now composes those presets explicitly in `oxlint/ultracite-js-plugins.mjs`: React Doctor's general rules reach the React preset, and its Next.js rules reach only the Next preset.

That split created one exception to "do not filter overlapping rules by default": React Doctor's `tanstack-start-*` rules are dropped, because several fire on generic JSX and recommend TanStack Router replacements in a lane that targets Next.js. The `query-*` rules are kept, since they only match TanStack Query's own API. This is a framework-relevance filter, not the duplicate-reconciliation layer the original decision rejected.

`@howells/lint` owns the pinned React Doctor Oxlint plugin and its parser compatibility dependency so consumer projects do not install them directly.
