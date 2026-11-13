import {
  createNoGenericComponentSuffixRule,
  createNoRawJsxElementsRule,
  createNoSingleClientComponentPageRule,
} from "./howells-policy-components.mjs";
import { createRequireDisableReasonRule } from "./howells-policy-disable-comments.mjs";
import {
  createNoCrossWorkspaceAppImportsRule,
  createNoDeepPackageImportsRule,
  createNoOutOfBoundsPackageImportsRule,
  createNoRuntimeDynamicImportsRule,
} from "./howells-policy-imports.mjs";
import { createNoRawMotionNamespaceRule } from "./howells-policy-motion.mjs";
import {
  createDesignTokenAlphaRule,
  createNoAvoidableArbitrarySpacingRule,
  createNoRawColourInClassStringsRule,
  createNoRawTypeUtilitiesRule,
  createTransitionAfterFocusHelperRule,
} from "./howells-policy-tailwind.mjs";
import { createConsistentTypeDefinitionsRule } from "./howells-policy-types.mjs";

const plugin = {
  meta: {
    name: "howells",
  },
  rules: {
    "consistent-type-definitions": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce object declaration style without changing explicit augmentation interfaces.",
        },
        messages: {},
        fixable: "code",
        schema: [{ enum: ["interface", "type"] }],
      },
      create: createConsistentTypeDefinitionsRule,
    },
    "no-generic-component-suffix": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow generic React component suffixes that hide responsibility.",
        },
        messages: {},
        schema: [],
      },
      create: createNoGenericComponentSuffixRule,
    },
    "no-single-client-component-page": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow Next page files that only pass through to one client component.",
        },
        messages: {},
        schema: [],
      },
      create: createNoSingleClientComponentPageRule,
    },
    "no-cross-workspace-app-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow packages importing apps and apps importing sibling apps.",
        },
        messages: {},
        schema: [],
      },
      create: createNoCrossWorkspaceAppImportsRule,
    },
    "require-disable-reason": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Require a ` -- reason` on every oxlint or eslint disable comment.",
        },
        messages: {},
        schema: [],
      },
      create: createRequireDisableReasonRule,
    },
    "no-runtime-dynamic-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow runtime import() expressions, optionally permitting a fixed relative specifier.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allowLocalModules: { type: "boolean", default: false },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoRuntimeDynamicImportsRule,
    },
    "no-raw-jsx-elements": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow raw lowercase HTML host elements — render design-system components instead. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allow: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoRawJsxElementsRule,
    },
    "no-raw-type-utilities": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow Tailwind typographic utilities in class strings unless sanctioned via `allow` — style through design-system type tokens instead. Governed namespace and allow-list are both param-driven; carries no project specifics. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allow: { type: "array", items: { type: "string" } },
              match: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoRawTypeUtilitiesRule,
    },
    "no-raw-motion-namespace": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow the full animation namespace (`motion.*`) in favour of the lazy primitives (`m.*`), which keep the animation engine out of every consumer's bundle. Namespace, replacement and exempt paths are all param-driven. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allowIn: { type: "array", items: { type: "string" } },
              namespace: { type: "string" },
              replacement: { type: "string" },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoRawMotionNamespaceRule,
    },
    "no-avoidable-arbitrary-spacing": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow an arbitrary spacing value that lands on a clean step of the spacing scale, because it has an exact standard equivalent. Governed utilities and the step are param-driven. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allowHalfSteps: { type: "boolean" },
              step: { type: "number" },
              utilities: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoAvoidableArbitrarySpacingRule,
    },
    "design-token-alpha": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Pin a utility that mirrors a design token inline to the token's alpha, so an inline mirror cannot drift from the token. The pins are supplied by the consumer; with none the rule is inert. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              requireAlphaSuffix: { type: "boolean" },
              tokens: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    alpha: { type: "number" },
                    utility: { type: "string" },
                  },
                  required: ["utility", "alpha"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createDesignTokenAlphaRule,
    },
    "transition-after-focus-helper": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow an unprefixed transition literal before a helper that emits its own transition value inside one merge call, because tailwind-merge keeps the last class in the group and the helper deletes the earlier one. Merge functions, helpers and the conflict group are param-driven; with no helpers the rule is inert. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              conflictPrefix: { type: "string" },
              helpers: { type: "array", items: { type: "string" } },
              mergeFunctions: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createTransitionAfterFocusHelperRule,
    },
    "no-deep-package-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow reaching past a package's published shim into its internal file layout. Governed subpath roots and their allowed depth are supplied by the consumer; with none the rule is inert. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              prefixes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    allow: { type: "array", items: { type: "string" } },
                    depth: { type: "number" },
                    prefix: { type: "string" },
                  },
                  required: ["prefix", "depth"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoDeepPackageImportsRule,
    },
    "no-raw-colour-in-class-strings": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow a raw colour value inside a bracketed arbitrary class value, which is invisible to the theme. A `var(--token)` reference is the sanctioned escape. Merge helpers, exempt paths and permitted CSS functions are all param-driven. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              allowFunctions: { type: "array", items: { type: "string" } },
              allowIn: { type: "array", items: { type: "string" } },
              functions: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoRawColourInClassStringsRule,
    },
    "no-out-of-bounds-package-imports": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Confine a dependency namespace to the directory that owns it, so every other file reaches it through that package's own exports. Restricted specifiers and owning directories are supplied by the consumer; with either list empty the rule is inert. Opt-in; not enabled by any preset.",
        },
        messages: {},
        schema: [
          {
            type: "object",
            properties: {
              packages: { type: "array", items: { type: "string" } },
              within: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
      },
      create: createNoOutOfBoundsPackageImportsRule,
    },
  },
};

export default plugin;
