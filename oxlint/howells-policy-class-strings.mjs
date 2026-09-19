// Shared scaffolding for the policy rules that read Tailwind class strings.
//
// Every one of them governs the same source positions — `className`/`class`
// attributes, class-helper call arguments (`cn`, `cva`, …), and
// `Record<*Size, string>` size ladders — so the AST scoping lives here once and
// each rule supplies only its own token test. Scoping to those positions is
// what keeps a same-spelled word in a comment, a JSDoc `@example`, or an
// unrelated string prop out of the diagnostics.

export const CLASS_HELPER_NAMES = new Set([
  "cn",
  "cx",
  "clsx",
  "cva",
  "tv",
  "twMerge",
  "twJoin",
  "classNames",
]);

/** Compile a glob (`*` = any run of chars) into an anchored, whole-string RegExp. */
export function globToRegExp(glob) {
  const source = glob.replace(/[.*+?^${}()|[\]\\]/gu, (character) =>
    character === "*" ? ".*" : `\\${character}`
  );
  return new RegExp(`^${source}$`, "u");
}

/** Escape a literal string for use inside a RegExp source. */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * The base utility of a Tailwind token — everything after the last top-level
 * `:` (variant prefixes stripped), with the important marker and any modifier
 * suffix removed.
 *
 * Depth counts both brackets and parentheses, so neither a `:` nor a `/` inside
 * them splits: `data-[state=open]:text-lg`, `text-[calc(1rem/2)]`, and v4's
 * CSS-variable shorthand `text-(length:--my-size)` all survive whole.
 *
 * The important marker is stripped in all three positions Tailwind allows it:
 * v3's `!text-xl` and `hover:!text-xl` (the marker sits after the variant), and
 * v4's `text-xl!`. So is the modifier a size carries for its leading
 * (`text-sm/6`). A size is a size whatever it is shouted or paired with.
 */
export function baseUtility(token) {
  const stripped = token.endsWith("!") ? token.slice(0, -1) : token;
  let depth = 0;
  let lastColon = -1;
  let lastSlash = -1;
  for (let index = 0; index < stripped.length; index += 1) {
    const character = stripped[index];
    if (character === "[" || character === "(") {
      depth += 1;
    } else if (character === "]" || character === ")") {
      depth -= 1;
    } else if (depth === 0 && character === ":") {
      lastColon = index;
      lastSlash = -1;
    } else if (depth === 0 && character === "/") {
      lastSlash = index;
    }
  }
  const base = stripped.slice(
    lastColon + 1,
    lastSlash === -1 ? undefined : lastSlash
  );
  return base.startsWith("!") ? base.slice(1) : base;
}

/** True when `declarator` is annotated `Record<…Size, string>` (a size ladder). */
function isRecordSizeStringAnnotation(declarator) {
  const annotation = declarator?.id?.typeAnnotation?.typeAnnotation;
  if (!annotation || annotation.type !== "TSTypeReference") {
    return false;
  }
  if (annotation.typeName?.name !== "Record") {
    return false;
  }
  const params =
    (annotation.typeArguments ?? annotation.typeParameters)?.params ?? [];
  if (params.length < 2) {
    return false;
  }
  const [keyType, valueType] = params;
  const keyName = keyType?.typeName?.name;
  return (
    typeof keyName === "string" &&
    keyName.endsWith("Size") &&
    valueType?.type === "TSStringKeyword"
  );
}

/** True when `node` is a call to one of the named class helpers (`cn`, `cva`, …). */
export function isClassHelperCall(node, helperNames = CLASS_HELPER_NAMES) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    helperNames.has(node.callee.name)
  );
}

/**
 * The source offset of the first character of a string node's *content*, so a
 * token found inside the value can be reported at its own position rather than
 * against the whole literal. Returns `null` when the node carries no usable
 * range.
 */
export function stringContentStart(node) {
  const range = node?.range;
  if (!Array.isArray(range) || typeof range[0] !== "number") {
    return null;
  }
  if (node.type === "TemplateElement") {
    return range[0];
  }
  const raw = node.raw;
  const quote = typeof raw === "string" ? raw[0] : undefined;
  return quote === '"' || quote === "'" ? range[0] + 1 : range[0];
}

/**
 * Report a token found inside a class string at the token's own range. Falls
 * back to the whole string node whenever the computed range would leave the
 * node — an escape sequence in the literal makes value offsets and source
 * offsets disagree, and a wrong span is worse than a wide one.
 */
export function reportClassToken(context, node, index, length, message) {
  const start = stringContentStart(node);
  const from = start === null ? null : start + index;
  if (from === null || from + length > node.range[1]) {
    context.report({ message, node });
    return;
  }
  context.report({ message, node: { range: [from, from + length] } });
}

/**
 * The visitor set for rules whose token shape is unmistakable on its own -
 * `w-[320px]`, `ring-gray-500/30` - and so does not need className scoping to
 * stay out of prose. Every string literal and template quasi in the file is
 * offered, which is what lets a class list held in a plain constant be governed
 * as well as one written inline on an element.
 */
export function createStringVisitors(onString) {
  return {
    Literal(node) {
      if (typeof node.value === "string") {
        onString(node.value, node);
      }
    },
    TemplateElement(node) {
      onString(node.value?.cooked ?? node.value?.raw ?? "", node);
    },
  };
}

/**
 * The visitor set every class-string rule shares. `onClassString(value, node)`
 * is called once per string literal, template quasi, or attribute value that
 * holds class names.
 */
export function createClassStringVisitors(
  onClassString,
  helperNames = CLASS_HELPER_NAMES
) {
  function checkString(value, node) {
    if (typeof value === "string") {
      onClassString(value, node);
    }
  }

  // Walk an expression subtree that is known to carry class strings, checking
  // every string literal / template quasi and recursing only into class-helper
  // calls (never arbitrary calls — their string args aren't class names).
  function scanClassExpression(node) {
    if (!node) {
      return;
    }
    switch (node.type) {
      case "Literal":
        checkString(node.value, node);
        break;
      case "TemplateLiteral":
        for (const quasi of node.quasis) {
          checkString(quasi.value?.cooked ?? quasi.value?.raw ?? "", quasi);
        }
        for (const expression of node.expressions) {
          scanClassExpression(expression);
        }
        break;
      case "ConditionalExpression":
        scanClassExpression(node.consequent);
        scanClassExpression(node.alternate);
        break;
      case "LogicalExpression":
      case "BinaryExpression":
        scanClassExpression(node.left);
        scanClassExpression(node.right);
        break;
      case "ArrayExpression":
        for (const element of node.elements) {
          scanClassExpression(element);
        }
        break;
      case "ObjectExpression":
        for (const property of node.properties) {
          if (property.type === "Property") {
            if (property.key?.type === "Literal") {
              scanClassExpression(property.key);
            }
            scanClassExpression(property.value);
          } else if (property.type === "SpreadElement") {
            scanClassExpression(property.argument);
          }
        }
        break;
      case "CallExpression":
        if (isClassHelperCall(node, helperNames)) {
          for (const argument of node.arguments) {
            scanClassExpression(argument);
          }
        }
        break;
      case "SpreadElement":
        scanClassExpression(node.argument);
        break;
      case "ParenthesizedExpression":
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
        scanClassExpression(node.expression);
        break;
      default:
        break;
    }
  }

  return {
    JSXAttribute(node) {
      const attributeName = node.name?.name;
      if (attributeName !== "className" && attributeName !== "class") {
        return;
      }
      const value = node.value;
      if (!value) {
        return;
      }
      if (value.type === "Literal") {
        checkString(value.value, value);
      } else if (value.type === "JSXExpressionContainer") {
        scanClassExpression(value.expression);
      }
    },
    CallExpression(node) {
      if (isClassHelperCall(node, helperNames)) {
        for (const argument of node.arguments) {
          scanClassExpression(argument);
        }
      }
    },
    VariableDeclarator(node) {
      if (isRecordSizeStringAnnotation(node)) {
        scanClassExpression(node.init);
      }
    },
  };
}
