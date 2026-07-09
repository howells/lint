import fs from "node:fs";
import path from "node:path";

const BANNED_SUFFIXES = [
  { kebab: "wrapper", pascal: "Wrapper" },
  { kebab: "client", pascal: "Client" },
  { kebab: "page", pascal: "Page" },
  { kebab: "component", pascal: "Component" },
  { kebab: "container", pascal: "Container" },
  { kebab: "manager", pascal: "Manager" },
];

const COMPONENT_FILE_PATTERN = /\.[jt]sx$/u;
const PASCAL_CASE_PATTERN = /^[A-Z]/u;
const RELATIVE_IMPORT_PATTERN = /^\.{1,2}(?:\/|$)/u;
const MODULE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js", ".mts", ".mjs"];
const WORKSPACE_ROOT_SEGMENTS = new Set(["apps", "packages"]);

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

function basename(filename) {
  const normalized = normalizeFilename(filename);
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

function withoutExtension(filename) {
  return filename.replace(/\.[^.]+$/u, "");
}

function isNextAppPageFile(filename) {
  return /(?:^|\/)(?:src\/)?app\/(?:.*\/)?page\.[jt]sx$/u.test(normalizeFilename(filename));
}

function findFilenameSuffix(filename) {
  if (!COMPONENT_FILE_PATTERN.test(filename)) {
    return null;
  }

  if (isNextAppPageFile(filename)) {
    return null;
  }

  const stem = withoutExtension(basename(filename)).toLowerCase();
  return BANNED_SUFFIXES.find(({ kebab }) => stem === kebab || stem.endsWith(`-${kebab}`));
}

function findComponentNameSuffix(name) {
  if (!PASCAL_CASE_PATTERN.test(name)) {
    return null;
  }

  return BANNED_SUFFIXES.find(({ pascal }) => name === pascal || name.endsWith(pascal));
}

function isAllowedNextPageComponent(name, filename) {
  return isNextAppPageFile(filename) && (name === "Page" || name.endsWith("Page"));
}

function hasUseClientDirective(source) {
  return /^(?:\uFEFF)?\s*["']use client["']\s*;/u.test(source);
}

function resolveRelativeModule(filename, specifier) {
  const basePath = path.resolve(path.dirname(filename), specifier);
  const candidates = path.extname(basePath)
    ? [basePath]
    : [
        ...MODULE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
        ...MODULE_EXTENSIONS.map((extension) => path.join(basePath, `index${extension}`)),
      ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function isClientComponentModule(filename, specifier) {
  if (!RELATIVE_IMPORT_PATTERN.test(specifier)) {
    return false;
  }

  const modulePath = resolveRelativeModule(filename, specifier);
  if (!modulePath) {
    return false;
  }

  return hasUseClientDirective(fs.readFileSync(modulePath, "utf8"));
}

function isPascalCaseJsxName(nameNode) {
  return nameNode?.type === "JSXIdentifier" && PASCAL_CASE_PATTERN.test(nameNode.name);
}

function findWorkspaceElement(filename) {
  const segments = normalizeFilename(filename).split("/");

  for (let index = 0; index < segments.length - 1; index += 1) {
    const rootSegment = segments[index];

    if (WORKSPACE_ROOT_SEGMENTS.has(rootSegment) && segments[index + 1]) {
      return {
        name: segments[index + 1],
        type: rootSegment === "apps" ? "app" : "package",
      };
    }
  }

  return null;
}

function resolveImportPath(filename, specifier) {
  if (RELATIVE_IMPORT_PATTERN.test(specifier)) {
    return path.resolve(path.dirname(filename), specifier);
  }

  return specifier;
}

function getSingleJsxElement(expression) {
  if (!expression) {
    return null;
  }

  if (expression.type === "JSXElement") {
    return expression;
  }

  if (expression.type === "ParenthesizedExpression") {
    return getSingleJsxElement(expression.expression);
  }

  if (expression.type !== "JSXFragment") {
    return null;
  }

  const elementChildren = expression.children.filter(
    (child) => child.type === "JSXElement" || child.type === "JSXFragment",
  );
  const meaningfulTextChildren = expression.children.filter(
    (child) => child.type === "JSXText" && child.value.trim() !== "",
  );

  if (elementChildren.length !== 1 || meaningfulTextChildren.length > 0) {
    return null;
  }

  return getSingleJsxElement(elementChildren[0]);
}

function getSingleReturnedComponentName(body) {
  if (!body || body.type !== "BlockStatement" || body.body.length !== 1) {
    return null;
  }

  const statement = body.body[0];
  if (statement.type !== "ReturnStatement") {
    return null;
  }

  const element = getSingleJsxElement(statement.argument);
  const jsxName = element?.openingElement?.name;
  if (!isPascalCaseJsxName(jsxName)) {
    return null;
  }

  return jsxName.name;
}

function createNoGenericComponentSuffixRule(context) {
  const filename = normalizeFilename(context.filename ?? "");
  const reportedNodes = new WeakSet();

  function reportFilename(programNode) {
    const suffix = findFilenameSuffix(filename);
    if (!suffix) {
      return;
    }

    context.report({
      node: programNode,
      message: `Avoid generic component suffix "${suffix.kebab}" in filename "${basename(filename)}". Name the component after the specific UI, behavior, or domain responsibility it owns.`,
    });
  }

  function reportComponentName(nameNode) {
    if (!nameNode || reportedNodes.has(nameNode)) {
      return;
    }

    const suffix = findComponentNameSuffix(nameNode.name);
    if (!suffix || isAllowedNextPageComponent(nameNode.name, filename)) {
      return;
    }

    reportedNodes.add(nameNode);
    context.report({
      node: nameNode,
      message: `Avoid generic component suffix "${suffix.kebab}" in component "${nameNode.name}". Name the component after the specific UI, behavior, or domain responsibility it owns.`,
    });
  }

  if (!COMPONENT_FILE_PATTERN.test(filename)) {
    return {};
  }

  return {
    Program: reportFilename,
    ClassDeclaration(node) {
      reportComponentName(node.id);
    },
    FunctionDeclaration(node) {
      reportComponentName(node.id);
    },
    VariableDeclarator(node) {
      if (node.id?.type === "Identifier") {
        reportComponentName(node.id);
      }
    },
    ExportDefaultDeclaration(node) {
      const declaration = node.declaration;
      if (declaration?.type === "FunctionDeclaration" || declaration?.type === "ClassDeclaration") {
        reportComponentName(declaration.id);
      }
    },
  };
}

function createNoSingleClientComponentPageRule(context) {
  const filename = normalizeFilename(context.filename ?? "");
  const importedComponentSources = new Map();

  function reportSingleClientComponentPage(node, componentName) {
    const source = importedComponentSources.get(componentName);
    if (!source || !isClientComponentModule(filename, source)) {
      return;
    }

    context.report({
      node,
      message: `Avoid making a Next page a pass-through to one client component "${componentName}". Keep route-level data loading and server composition in the page, and move only interactive leaves behind the client boundary.`,
    });
  }

  function checkPageFunction(node) {
    const componentName = getSingleReturnedComponentName(node.body);
    if (!componentName) {
      return;
    }

    reportSingleClientComponentPage(node, componentName);
  }

  if (!isNextAppPageFile(filename)) {
    return {};
  }

  return {
    ImportDeclaration(node) {
      if (
        typeof node.source?.value !== "string" ||
        !RELATIVE_IMPORT_PATTERN.test(node.source.value)
      ) {
        return;
      }

      for (const specifier of node.specifiers ?? []) {
        if (specifier.type === "ImportSpecifier" && specifier.local?.type === "Identifier") {
          importedComponentSources.set(specifier.local.name, node.source.value);
        }

        if (specifier.type === "ImportDefaultSpecifier" && specifier.local?.type === "Identifier") {
          importedComponentSources.set(specifier.local.name, node.source.value);
        }
      }
    },
    ExportDefaultDeclaration(node) {
      if (node.declaration?.type === "FunctionDeclaration") {
        checkPageFunction(node.declaration);
      }
    },
  };
}

function createNoCrossWorkspaceAppImportsRule(context) {
  const filename = normalizeFilename(context.filename ?? "");
  const fromElement = findWorkspaceElement(filename);

  function checkSource(node) {
    const specifier = node.source?.value;

    if (!fromElement || typeof specifier !== "string") {
      return;
    }

    const toElement = findWorkspaceElement(resolveImportPath(filename, specifier));

    if (!toElement || toElement.type !== "app") {
      return;
    }

    if (fromElement.type === "package") {
      context.report({
        node,
        message: `Packages must not import from apps. Move shared code out of "apps/${toElement.name}" before importing it from "packages/${fromElement.name}".`,
      });
      return;
    }

    if (fromElement.type === "app" && fromElement.name !== toElement.name) {
      context.report({
        node,
        message: `Apps must not import from other apps. Move shared code out of "apps/${toElement.name}" before importing it from "apps/${fromElement.name}".`,
      });
    }
  }

  if (!fromElement) {
    return {};
  }

  return {
    ExportAllDeclaration: checkSource,
    ExportNamedDeclaration: checkSource,
    ImportDeclaration: checkSource,
  };
}

function createNoRuntimeDynamicImportsRule(context) {
  return {
    ImportExpression(node) {
      context.report({
        node,
        message:
          "Runtime dynamic imports make package loading harder to trace and validate. Use a static import instead.",
      });
    },
  };
}

const LOWERCASE_TAG_PATTERN = /^[a-z]/u;

// Generic, cross-project version of the "no naked host element" doctrine. A raw
// lowercase JSX tag (<div>, <span>, <button>, …) is a naked HTML host element;
// this rule bans them so application markup renders only through a project's
// design-system component vocabulary. It carries no design-system-specific
// replacement table — the diagnostic is deliberately generic — so any Howells
// project can opt in and point it at its own component set.
//
// The rule is OPT-IN: it is not enabled by any shared preset, because banning
// every host element is a strong, project-specific choice. Once the `howells`
// plugin is loaded (every preset already wires it via `jsPlugins`), a consumer
// turns it on with `"howells/no-raw-jsx-elements": "error"` in their own config
// and lists sanctioned host tags (e.g. the Next root shell's `html`/`body`) in
// the `allow` option.
//
// Uppercase components (Foo), member expressions (Foo.Bar), namespaced names
// (svg:path) and fragments are never bare hosts and are always left alone.

/**
 * ESLint-style rule factory for `no-raw-jsx-elements`. Visits every JSX opening
 * element and reports raw lowercase host elements unless the tag appears in
 * `options[0].allow`.
 *
 * @param {{ options?: Array<{ allow?: string[] }>, report: Function }} context
 */
function createNoRawJsxElementsRule(context) {
  const allow = new Set(context.options?.[0]?.allow ?? []);

  return {
    JSXOpeningElement(node) {
      const name = node.name;
      // JSXMemberExpression (Foo.Bar) and JSXNamespacedName are never bare hosts.
      if (name?.type !== "JSXIdentifier") {
        return;
      }

      const tag = name.name;
      // Uppercase → a component; only lowercase identifiers are raw HTML hosts.
      if (!LOWERCASE_TAG_PATTERN.test(tag)) {
        return;
      }

      if (allow.has(tag)) {
        return;
      }

      context.report({
        node: name,
        message: `Raw <${tag}> is banned — render a design-system component instead (configure \`allow\` for sanctioned host elements).`,
      });
    },
  };
}

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
// OPT-IN, like `no-raw-jsx-elements` — enabled by no preset. Real AST scoping
// (className/class attributes, `cn|cva|tv|…` call arguments, and
// `Record<*Size, string>` size-ladder objects) is the whole point: it never
// fires on a same-spelled word in a comment, a JSDoc `@example`, or an unrelated
// string prop (a Radix `value="italic"` is untouched).

const CLASS_HELPER_NAMES = new Set([
  "cn",
  "cx",
  "clsx",
  "cva",
  "tv",
  "twMerge",
  "twJoin",
  "classNames",
]);

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
const ARBITRARY_COLOUR_PATTERN = /^(?:#|var\(|rgb|hsl|okl(?:ch|ab)|color\()/u;

/** Compile a glob (`*` = any run of chars) into an anchored, whole-string RegExp. */
function globToRegExp(glob) {
  const source = glob.replace(/[.*+?^${}()|[\]\\]/gu, (character) =>
    character === "*" ? ".*" : `\\${character}`
  );
  return new RegExp(`^${source}$`, "u");
}

/**
 * The base utility of a Tailwind token — everything after the last top-level
 * `:` (variant prefixes stripped), with a leading `!` (important) removed.
 * Colons inside `[…]` (arbitrary variants like `data-[state=open]:`) don't split.
 */
function baseUtility(token) {
  const stripped = token.startsWith("!") ? token.slice(1) : token;
  let depth = 0;
  let lastColon = -1;
  for (let index = 0; index < stripped.length; index += 1) {
    const character = stripped[index];
    if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
    } else if (character === ":" && depth === 0) {
      lastColon = index;
    }
  }
  return stripped.slice(lastColon + 1);
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
    /Size$/u.test(keyName) &&
    valueType?.type === "TSStringKeyword"
  );
}

/**
 * ESLint-style rule factory for `no-raw-type-utilities`. Scans class strings in
 * `className`/`class` attributes, class-helper call arguments, and
 * `Record<*Size, string>` size ladders, reporting each governed typographic
 * class not sanctioned by `allow`, once per string node.
 *
 * @param {{ options?: Array<{ allow?: string[], match?: string[] }>, report: Function }} context
 */
function createNoRawTypeUtilitiesRule(context) {
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
      message: `Typographic utility "${base}" is not in the sanctioned set — only classes matched by this rule's \`allow\` option are permitted. Style through your design-system type tokens or component props instead.`,
    });
  }

  function checkClassString(value, node) {
    if (typeof value !== "string") {
      return;
    }
    for (const token of value.split(/\s+/u)) {
      if (token === "") {
        continue;
      }
      const base = baseUtility(token);
      if (isBanned(base)) {
        reportToken(node, base);
      }
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
        if (typeof node.value === "string") {
          checkClassString(node.value, node);
        }
        break;
      case "TemplateLiteral":
        for (const quasi of node.quasis) {
          checkClassString(quasi.value?.cooked ?? quasi.value?.raw ?? "", quasi);
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
        if (
          node.callee?.type === "Identifier" &&
          CLASS_HELPER_NAMES.has(node.callee.name)
        ) {
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
        checkClassString(value.value, value);
      } else if (value.type === "JSXExpressionContainer") {
        scanClassExpression(value.expression);
      }
    },
    CallExpression(node) {
      if (
        node.callee?.type === "Identifier" &&
        CLASS_HELPER_NAMES.has(node.callee.name)
      ) {
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

const plugin = {
  meta: {
    name: "howells",
  },
  rules: {
    "no-generic-component-suffix": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Disallow generic React component suffixes that hide responsibility.",
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
          description: "Disallow Next page files that only pass through to one client component.",
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
          description: "Disallow packages importing apps and apps importing sibling apps.",
        },
        messages: {},
        schema: [],
      },
      create: createNoCrossWorkspaceAppImportsRule,
    },
    "no-runtime-dynamic-imports": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow runtime import() expressions.",
        },
        messages: {},
        schema: [],
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
  },
};

export default plugin;
