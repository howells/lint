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
  },
};

export default plugin;
