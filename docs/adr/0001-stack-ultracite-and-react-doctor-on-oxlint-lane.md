# 0001. Stack Ultracite and React Doctor in one preset

For React and Next.js projects, `@howells/lint/oxlint/react` stacks Ultracite's React preset with React Doctor's rules, and `@howells/lint/oxlint/next` extends it with the Next.js rules. Overlapping rules are not filtered.

Some React Doctor rules duplicate Ultracite's React and accessibility rules. Filtering them would need a reconciliation layer that drifts whenever either upstream changes. Coverage is preferred over a local rule matrix, so duplicate findings are accepted.

One exception, which is a framework-relevance filter and not a duplicate filter: React Doctor's `tanstack-start-*` rules are dropped, because several fire on generic JSX and recommend TanStack Router replacements in a lane that targets Next.js. The `query-*` rules stay, since they only match TanStack Query's own API. The presets are composed explicitly in `oxlint/ultracite-js-plugins.mjs`, and this package owns the pinned React Doctor plugin so consumers install nothing directly.
