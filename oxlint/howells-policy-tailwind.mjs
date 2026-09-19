// The policy rules that read Tailwind class strings. Each is param-driven and
// carries no project's token names, utility list or helper names in a default
// that would make it project-specific.

import {
  baseUtility,
  createClassStringVisitors,
  createStringVisitors,
  escapeRegExp,
  globToRegExp,
  reportClassToken,
} from "./howells-policy-class-strings.mjs";
import { matchesAnyPath, normalizeFilename } from "./howells-policy-paths.mjs";

// Generic, cross-project ban on Tailwind *typographic* utilities in class
// strings: any class in the governed typographic namespace is banned UNLESS it
// is sanctioned via the `allow` option. The rule carries no project-specific
// token table — a project passes its own design-system type classes in `allow`,
// and everything else typographic (raw `text-sm`, `font-*`, `leading-*`,
// `tracking-*`, `uppercase`, arbitrary `text-[13px]`, …) is reported.
//
// Both axes are configurable via params:
//   - `allow`: glob patterns (`*` wildcard) for the sanctioned classes.
//   - `match`: glob patterns for the governed namespace (defaults to standard
//     Tailwind typography; override to widen/narrow what the rule polices).
// Colour (`text-[#…]`/`text-[var…]`), alignment (`text-center`), and wrapping
// (`text-balance`) are NOT in the default namespace — they aren't type-ramp
// choices — but a project can add them to `match` if it wants them governed.
//
// OPT-IN, like `no-raw-jsx-elements` — enabled by no preset.

// The governed typographic namespace when no `match` is configured — standard
// Tailwind typography only (font, size, leading, tracking, transform, style),
// deliberately excluding colour/alignment/wrapping. Not project-specific.
const DEFAULT_MATCH = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
  "text-[*]",
  // v4's CSS-variable shorthand for a size: `text-(length:--my-size)`.
  "text-(length:*)",
  "font-*",
  "leading-*",
  "tracking-*",
  "uppercase",
  "lowercase",
  "capitalize",
  "normal-case",
  "italic",
  "not-italic",
];

// Arbitrary `text-[…]` whose value reads as a colour (owned by the colour rule),
// not a length — never governed even when `text-[*]` is in the namespace.
// `color[-:(]` covers all three spellings at once: the functional `color(`, the
// `color-mix(` blend, and the explicit `color:` type hint Tailwind accepts to
// disambiguate a bare `var()`.
const ARBITRARY_COLOUR_PATTERN =
  /^(?:#|var\(|rgb|hsl|okl(?:ch|ab)|color[-:(])/u;

// An arbitrary `text-[…]` carrying a length rather than a colour, which earns a
// different fix from a named size: the scale, or a named `@theme` step.
//
// The colour test is unreachable from the current caller — `isBanned` already
// drops arbitrary colours before anything is reported — and stays so the
// predicate is right on its own terms if a second call site ever appears.
const ARBITRARY_LENGTH_PATTERN = /^text-\[[^\]]+\]$/u;

function isArbitraryLength(base) {
  if (!ARBITRARY_LENGTH_PATTERN.test(base)) {
    return false;
  }
  return !ARBITRARY_COLOUR_PATTERN.test(base.slice("text-[".length, -1));
}

/**
 * ESLint-style rule factory for `no-raw-type-utilities`. Scans class strings in
 * `className`/`class` attributes, class-helper call arguments, and
 * `Record<*Size, string>` size ladders, reporting each governed typographic
 * class not sanctioned by `allow`, once per string node.
 *
 * @param {{ options?: Array<{ allow?: string[], match?: string[] }>, report: Function }} context
 */
export function createNoRawTypeUtilitiesRule(context) {
  const options = context.options?.[0] ?? {};
  const allowMatchers = (options.allow ?? []).map(globToRegExp);
  const matchMatchers = (options.match ?? DEFAULT_MATCH).map(globToRegExp);
  const reportedByNode = new WeakMap();

  // A base utility is governed (matches the namespace), not sanctioned (matches
  // no `allow` glob), and — for arbitrary `text-[…]` — not a colour value.
  function isBanned(base) {
    if (allowMatchers.some((matcher) => matcher.test(base))) {
      return false;
    }
    if (base.startsWith("text-[") && base.endsWith("]")) {
      const inner = base.slice("text-[".length, -1);
      if (ARBITRARY_COLOUR_PATTERN.test(inner)) {
        return false;
      }
    }
    return matchMatchers.some((matcher) => matcher.test(base));
  }

  function reportToken(node, base) {
    let seen = reportedByNode.get(node);
    if (seen === undefined) {
      seen = new Set();
      reportedByNode.set(node, seen);
    }
    if (seen.has(base)) {
      return;
    }
    seen.add(base);
    context.report({
      node,
      message: `Typographic utility "${base}" is not in the sanctioned set — only classes matched by this rule's \`allow\` option are permitted. ${
        isArbitraryLength(base)
          ? "An arbitrary size is the last resort: use the nearest step on the scale, or add a named step to your `@theme` so the value has a name the next file can reuse."
          : "Style through your design-system type tokens or component props instead."
      }`,
    });
  }

  return createClassStringVisitors((value, node) => {
    for (const token of value.split(/\s+/u)) {
      if (token === "") {
        continue;
      }
      const base = baseUtility(token);
      if (isBanned(base)) {
        reportToken(node, base);
      }
    }
  });
}

// A spacing-family utility written as an arbitrary `-[Npx]` or `-[Nrem]` whose
// value lands on a clean step of the spacing scale has an exact standard
// equivalent: Tailwind v4 generates spacing on demand from `--spacing`, so
// `w-[320px]` is `w-80`. A value that is *not* on a step has nothing to convert
// to, and the rule stays quiet — an arbitrary value is the right answer there.
//
// The utility list is the parameter that makes this generic: only a spacing
// family is governed, so `text-[13px]`, `ring-[3px]`, `z-[60]` and the rest of
// the non-spacing scales are never reported here.

const DEFAULT_SPACING_UTILITIES = [
  "w",
  "h",
  "min-w",
  "min-h",
  "max-w",
  "max-h",
  "size",
  "p",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "ps",
  "pe",
  "m",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "ms",
  "me",
  "gap",
  "gap-x",
  "gap-y",
  "space-x",
  "space-y",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "inset-x",
  "inset-y",
  "translate-x",
  "translate-y",
  "start",
  "end",
  "basis",
  "scroll-mt",
  "scroll-mb",
];

const PIXELS_PER_REM = 16;

/**
 * The arbitrary-spacing matcher. The leading boundary class is load-bearing: it
 * is what keeps an arbitrary *variant* (`data-[state=open]:`, `[&>svg]:`,
 * `@[400px]:`, `group-has-[…]:`) out of the match, because the bracket in a
 * variant is never preceded by one of these characters at a utility boundary.
 */
function arbitrarySpacingPattern(utilities) {
  const alternation = [...utilities]
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join("|");
  return new RegExp(
    `(^|[\\s"'\`{:!])(-?(?:${alternation})-\\[(\\d+(?:\\.\\d+)?)(px|rem)\\])`,
    "gu"
  );
}

/**
 * ESLint-style rule factory for `no-avoidable-arbitrary-spacing`.
 *
 * @param {{ options?: Array<{ utilities?: string[], step?: number, allowHalfSteps?: boolean }>, report: Function }} context
 */
export function createNoAvoidableArbitrarySpacingRule(context) {
  const options = context.options?.[0] ?? {};
  const utilities = options.utilities ?? DEFAULT_SPACING_UTILITIES;
  const step = typeof options.step === "number" ? options.step : 0.25;
  const allowHalfSteps = options.allowHalfSteps !== false;
  const pattern = arbitrarySpacingPattern(utilities);

  function isCleanStep(value, unit) {
    if (step <= 0) {
      return false;
    }
    const steps =
      unit === "px" ? value / (step * PIXELS_PER_REM) : value / step;
    const remainder = Math.abs(steps % 1);
    if (remainder < Number.EPSILON) {
      return true;
    }
    return allowHalfSteps && Math.abs(remainder - 0.5) < Number.EPSILON;
  }

  return createStringVisitors((value, node) => {
    pattern.lastIndex = 0;
    let match = pattern.exec(value);
    while (match !== null) {
      const [, boundary, token, magnitude, unit] = match;
      if (isCleanStep(Number.parseFloat(magnitude), unit)) {
        reportClassToken(
          context,
          node,
          match.index + boundary.length,
          token.length,
          `\`${token}\` has an exact standard equivalent; use the token scale.`
        );
      }
      match = pattern.exec(value);
    }
  });
}

// A utility that mirrors a design token inline must carry the token's alpha. An
// inline mirror at the wrong alpha drifts from the token silently, and for a
// focus ring that means under-contrasting against WCAG 1.4.11's 3:1 for
// non-text contrast. The rule is a general alpha-pin over a named utility, not a
// focus-ring rule, so one config entry covers rings, borders and shadows alike.

/**
 * ESLint-style rule factory for `design-token-alpha`.
 *
 * Each `tokens` entry pins one utility to one alpha. The match is anchored to a
 * whole utility at both ends, so a different shade (`ring-gray-400/30`) and a
 * different utility that merely contains the token's text
 * (`ring-offset-gray-500/30`) both stay quiet.
 *
 * @param {{ options?: Array<{ tokens?: Array<{ utility: string, alpha: number }>, requireAlphaSuffix?: boolean }>, report: Function }} context
 */
export function createDesignTokenAlphaRule(context) {
  const options = context.options?.[0] ?? {};
  const tokens = (options.tokens ?? []).filter(
    (entry) =>
      typeof entry?.utility === "string" && typeof entry?.alpha === "number"
  );
  const requireAlphaSuffix = options.requireAlphaSuffix === true;

  if (tokens.length === 0) {
    return {};
  }

  const pins = tokens.map((entry) => ({
    alpha: entry.alpha,
    utility: entry.utility,
    withAlpha: new RegExp(
      `(^|[\\s"'\`{:!])(${escapeRegExp(entry.utility)}/(\\d+))(?![\\w.])`,
      "gu"
    ),
    bare: new RegExp(
      `(^|[\\s"'\`{:!])(${escapeRegExp(entry.utility)})(?![\\w/.-])`,
      "gu"
    ),
  }));

  return createStringVisitors((value, node) => {
    for (const pin of pins) {
      pin.withAlpha.lastIndex = 0;
      let match = pin.withAlpha.exec(value);
      while (match !== null) {
        const [, boundary, token, found] = match;
        if (Number.parseInt(found, 10) !== pin.alpha) {
          reportClassToken(
            context,
            node,
            match.index + boundary.length,
            token.length,
            `\`${pin.utility}/${found}\` drifts from the token alpha; use \`${pin.utility}/${pin.alpha}\`.`
          );
        }
        match = pin.withAlpha.exec(value);
      }

      if (!requireAlphaSuffix) {
        continue;
      }
      pin.bare.lastIndex = 0;
      let bareMatch = pin.bare.exec(value);
      while (bareMatch !== null) {
        const [, boundary, token] = bareMatch;
        reportClassToken(
          context,
          node,
          bareMatch.index + boundary.length,
          token.length,
          `\`${pin.utility}\` carries no alpha; use \`${pin.utility}/${pin.alpha}\`.`
        );
        bareMatch = pin.bare.exec(value);
      }
    }
  });
}

// Inside one merge call, an unprefixed `transition-*` literal must not appear
// before a helper that contributes its own transition value. tailwind-merge
// keeps the last class in a conflicting group, so the helper's narrower
// `transition-[…]` silently deletes the earlier explicit list. The sanctioned
// order is the reverse — helper first, the explicit superset after — because the
// later literal wins the merge.

const MAX_WALK_DEPTH = 40;

function transitionTokenPattern(conflictPrefix) {
  return new RegExp(
    `(^|[\\s"'\`,([])(${escapeRegExp(conflictPrefix)}(?:-\\[[^\\]]*\\]|-[a-z-]+)?)(?=[\\s"'\`,)\\]]|$)`,
    "gu"
  );
}

function calleeName(node) {
  const callee = node.callee;
  if (callee?.type === "Identifier") {
    return callee.name;
  }
  if (callee?.type === "MemberExpression" && !callee.computed) {
    return callee.property?.name;
  }
  return undefined;
}

/**
 * Walk an argument subtree, visiting every node and pruning wherever `skip`
 * says so. Nested merge calls are their own scope, so pruning at one keeps the
 * outer call's ordering question separate from the inner one's.
 */
function walkArgument(node, visit, skip, depth = 0) {
  if (!node || typeof node !== "object" || depth > MAX_WALK_DEPTH) {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkArgument(item, visit, skip, depth + 1);
    }
    return;
  }
  if (typeof node.type !== "string" || skip(node)) {
    return;
  }
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "range" || key === "loc") {
      continue;
    }
    walkArgument(node[key], visit, skip, depth + 1);
  }
}

/**
 * ESLint-style rule factory for `transition-after-focus-helper`.
 *
 * @param {{ options?: Array<{ mergeFunctions?: string[], helpers?: string[], conflictPrefix?: string }>, report: Function }} context
 */
export function createTransitionAfterFocusHelperRule(context) {
  const options = context.options?.[0] ?? {};
  const mergeFunctions = new Set(options.mergeFunctions ?? ["cn"]);
  const helpers = new Set(options.helpers ?? []);
  const conflictPrefix = options.conflictPrefix ?? "transition";

  if (helpers.size === 0) {
    return {};
  }

  const pattern = transitionTokenPattern(conflictPrefix);
  const isMergeCall = (node) =>
    node.type === "CallExpression" &&
    mergeFunctions.has(calleeName(node) ?? "");

  function collectStringTokens(node, value, into) {
    pattern.lastIndex = 0;
    let match = pattern.exec(value);
    while (match !== null) {
      const [, boundary, token] = match;
      into.push({
        index: match.index + boundary.length,
        node,
        token,
      });
      match = pattern.exec(value);
    }
  }

  return {
    CallExpression(node) {
      if (!isMergeCall(node)) {
        return;
      }

      const transitions = [];
      const helperNames = [];

      for (const [index, argument] of (node.arguments ?? []).entries()) {
        const found = [];
        let helperName;
        walkArgument(
          argument,
          (child) => {
            if (child.type === "CallExpression") {
              const name = calleeName(child);
              if (name !== undefined && helpers.has(name)) {
                helperName ??= name;
              }
              return;
            }
            if (child.type === "Literal" && typeof child.value === "string") {
              collectStringTokens(child, child.value, found);
              return;
            }
            if (child.type === "TemplateElement") {
              collectStringTokens(
                child,
                child.value?.cooked ?? child.value?.raw ?? "",
                found
              );
            }
          },
          // The argument itself is never pruned; only a merge call *inside* it.
          (child) => child !== argument && isMergeCall(child)
        );

        if (helperName !== undefined) {
          helperNames.push({ index, name: helperName });
        }
        for (const entry of found) {
          transitions.push({
            argumentIndex: index,
            index: entry.index,
            node: entry.node,
            token: entry.token,
          });
        }
      }

      for (const transition of transitions) {
        const helper = helperNames.find(
          (entry) => entry.index > transition.argumentIndex
        );
        if (!helper) {
          continue;
        }
        reportClassToken(
          context,
          transition.node,
          transition.index,
          transition.token.length,
          `Move \`${transition.token}\` after \`${helper.name}()\`; tailwind-merge keeps the last class in the ${conflictPrefix} group, so the helper deletes this one.`
        );
      }
    },
  };
}

// A class string must carry design tokens and theme utilities, never a raw
// colour value. A raw colour in a class string is invisible to the theme: it
// does not respond to a mode switch, it cannot be retuned centrally, and it is
// not audited for contrast. A `var(--token)` inside the brackets is the
// sanctioned escape, because a token reference is what the rule steers towards.

const COLOUR_VALUE_PATTERN =
  /#[\da-f]{3,8}(?![\da-z])|(?:okl(?:ch|ab)|l(?:ch|ab)|rgba?|hsla?|color)\(/iu;
const BRACKETED_VALUE_PATTERN = /\[([^\]]*)\]/gu;
const CLASS_TOKEN_PATTERN = /\S+/gu;

/**
 * ESLint-style rule factory for `no-raw-colour-in-class-strings`.
 *
 * @param {{ filename?: string, options?: Array<{ functions?: string[], allowIn?: string[], allowFunctions?: string[] }>, report: Function }} context
 */
export function createNoRawColourInClassStringsRule(context) {
  const options = context.options?.[0] ?? {};
  const helperNames = new Set(options.functions ?? ["cn"]);
  const allowFunctions = options.allowFunctions ?? ["var"];
  const filename = normalizeFilename(context.filename ?? "");

  if (matchesAnyPath(filename, options.allowIn ?? [])) {
    return {};
  }

  // A `cn(...)` call inside a `className` is reached by both visitors, so each
  // token is reported once per string node.
  const reportedByNode = new WeakMap();

  function holdsRawColour(token) {
    BRACKETED_VALUE_PATTERN.lastIndex = 0;
    let bracket = BRACKETED_VALUE_PATTERN.exec(token);
    while (bracket !== null) {
      const inner = bracket[1];
      const sanctioned = allowFunctions.some((name) =>
        inner.includes(`${name}(`)
      );
      if (!sanctioned && COLOUR_VALUE_PATTERN.test(inner)) {
        return true;
      }
      bracket = BRACKETED_VALUE_PATTERN.exec(token);
    }
    return false;
  }

  return createClassStringVisitors((value, node) => {
    CLASS_TOKEN_PATTERN.lastIndex = 0;
    let match = CLASS_TOKEN_PATTERN.exec(value);
    while (match !== null) {
      const token = match[0];
      let seen = reportedByNode.get(node);
      if (seen === undefined) {
        seen = new Set();
        reportedByNode.set(node, seen);
      }
      if (!seen.has(match.index) && holdsRawColour(token)) {
        seen.add(match.index);
        reportClassToken(
          context,
          node,
          match.index,
          token.length,
          `\`${token}\`: a raw colour value in a class string is invisible to the theme; use a design token.`
        );
      }
      match = CLASS_TOKEN_PATTERN.exec(value);
    }
  }, helperNames);
}
