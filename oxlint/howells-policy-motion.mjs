// The policy rule that keeps a lazily-loaded animation namespace out of
// component code. The governed namespace and its replacement are both
// parameters, so the rule carries no project's import names.

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

/**
 * Compile one `allowIn` entry into a matcher over a normalized path. An entry
 * matches a file whose path ends with it (with or without an extension) and a
 * file inside a directory of that name, so both a file stem
 * (`motion-config`) and a directory (`motion-primitives`) work, and `*` stops
 * at a path separator.
 */
function suffixPattern(glob) {
  const source = glob.replace(/[.*+?^${}()|[\]\\]/gu, (character) =>
    character === "*" ? "[^/]*" : `\\${character}`
  );
  return new RegExp(`(?:^|/)${source}(?:\\.[\\w.]+)?(?:/|$)`, "u");
}

/** The member name on a namespace access, or `undefined` when it is computed. */
function memberName(node) {
  if (node.type === "JSXMemberExpression") {
    return node.property?.name;
  }
  if (node.type === "TSQualifiedName") {
    return node.right?.name;
  }
  if (node.computed) {
    return undefined;
  }
  return node.property?.name;
}

/**
 * ESLint-style rule factory for `no-raw-motion-namespace`. Components must
 * render the lightweight lazy primitives rather than the full namespace, which
 * pulls the whole animation engine into every consumer's bundle and defeats the
 * code-split.
 *
 * Hooks and provider components (`useScroll`, `AnimatePresence`, …) are bare
 * identifiers rather than members of the namespace object, so the member-access
 * match excludes them without an allow-list. Matching the AST rather than the
 * text is what keeps the namespace's name out of the diagnostics when it
 * appears in a comment or an unrelated string.
 *
 * @param {{ filename?: string, options?: Array<{ namespace?: string, replacement?: string, allowIn?: string[] }>, report: Function }} context
 */
export function createNoRawMotionNamespaceRule(context) {
  const options = context.options?.[0] ?? {};
  const namespace = options.namespace ?? "motion";
  const replacement = options.replacement ?? "m";
  const filename = normalizeFilename(context.filename ?? "");

  const exempt = (options.allowIn ?? []).some((glob) =>
    suffixPattern(glob).test(filename)
  );
  if (exempt) {
    return {};
  }

  function reportNamespaceAccess(node) {
    const member = memberName(node) ?? "*";
    context.report({
      message: `Render \`${replacement}.${member}\` instead of \`${namespace}.${member}\`; the full namespace pulls the animation engine into every consumer's bundle.`,
      node,
    });
  }

  function isNamespaceObject(object, identifierType) {
    return object?.type === identifierType && object.name === namespace;
  }

  return {
    CallExpression(node) {
      const callee = node.callee;
      if (
        callee?.type === "MemberExpression" &&
        isNamespaceObject(callee.object, "Identifier")
      ) {
        reportNamespaceAccess(callee);
      }
    },
    JSXOpeningElement(node) {
      const name = node.name;
      if (
        name?.type === "JSXMemberExpression" &&
        isNamespaceObject(name.object, "JSXIdentifier")
      ) {
        reportNamespaceAccess(name);
      }
    },
    TSTypeQuery(node) {
      const expression = node.exprName;
      if (
        expression?.type === "TSQualifiedName" &&
        isNamespaceObject(expression.left, "Identifier")
      ) {
        reportNamespaceAccess(expression);
        return;
      }
      if (
        expression?.type === "MemberExpression" &&
        isNamespaceObject(expression.object, "Identifier")
      ) {
        reportNamespaceAccess(expression);
      }
    },
  };
}
