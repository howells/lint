const isStringModule = (node) =>
  node.type === "TSModuleDeclaration" &&
  node.id?.type === "Literal" &&
  typeof node.id.value === "string";

function hasImportMeta(program, visitorKeys) {
  const pending = [program];

  while (pending.length > 0) {
    const node = pending.pop();
    if (
      node.type === "MetaProperty" &&
      node.meta.name === "import" &&
      node.property.name === "meta"
    ) {
      return true;
    }

    for (const key of visitorKeys[node.type] ?? []) {
      const child = node[key];
      if (Array.isArray(child)) {
        pending.push(...child.filter(Boolean));
      } else if (child) {
        pending.push(child);
      }
    }
  }

  return false;
}

function moduleClassification(program, filename, visitorKeys) {
  const explicit = program.body.some(
    (node) =>
      node.type === "ImportDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportAllDeclaration" ||
      node.type === "ExportDefaultDeclaration" ||
      node.type === "TSExportAssignment" ||
      (node.type === "TSImportEqualsDeclaration" &&
        node.moduleReference.type === "TSExternalModuleReference")
  );

  if (explicit || hasImportMeta(program, visitorKeys)) {
    return "external";
  }

  // TypeScript's forced/NodeNext module detection can change nondeclaration
  // files without changing Oxlint's sourceType. A plain .d.ts remains a script
  // without an explicit module indicator; other implicit contexts stay unknown.
  return filename.endsWith(".d.ts") ? "script-declaration" : "ambiguous";
}

function hasAugmentationAncestor(node, classification) {
  if (classification !== "external") {
    return false;
  }

  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (
      ancestor.type === "TSModuleDeclaration" &&
      (ancestor.global === true || isStringModule(ancestor))
    ) {
      return true;
    }
  }

  return false;
}

function hasStringModuleAncestor(node) {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (isStringModule(ancestor)) {
      return true;
    }
  }

  return false;
}

function hasGlobalAncestor(node) {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (ancestor.type === "TSModuleDeclaration" && ancestor.global === true) {
      return true;
    }
  }

  return false;
}

function withoutParentheses(node) {
  while (node.type === "TSParenthesizedType") {
    node = node.typeAnnotation;
  }

  return node;
}

function dropsComment(sourceCode, range, retainedRanges) {
  return sourceCode
    .getAllComments()
    .some(
      (comment) =>
        comment.range[0] >= range[0] &&
        comment.range[1] <= range[1] &&
        !retainedRanges.some(
          (retained) =>
            comment.range[0] >= retained[0] && comment.range[1] <= retained[1]
        )
    );
}

export function createConsistentTypeDefinitionsRule(context) {
  const preference = context.options[0] ?? "interface";
  const sourceCode = context.sourceCode;
  let classification;

  function declarationKeyword(node) {
    const first = sourceCode.getFirstToken(node);
    return first.value === "declare" ? sourceCode.getTokenAfter(first) : first;
  }

  function declarationName(node) {
    return sourceCode.text.slice(
      node.id.range[0],
      (node.typeParameters ?? node.id).range[1]
    );
  }

  function nameRange(node) {
    return [node.id.range[0], (node.typeParameters ?? node.id).range[1]];
  }

  return {
    TSTypeAliasDeclaration(node) {
      if (preference !== "interface") {
        return;
      }

      const type = withoutParentheses(node.typeAnnotation);
      if (type.type !== "TSTypeLiteral") {
        return;
      }

      const token = declarationKeyword(node);
      const range = [token.range[0], node.range[1]];
      const diagnostic = {
        node: token,
        message: "Use `interface` instead of `type`.",
      };
      if (!dropsComment(sourceCode, range, [nameRange(node), type.range])) {
        diagnostic.fix = (fixer) =>
          fixer.replaceTextRange(
            range,
            `interface ${declarationName(node)} ${sourceCode.getText(type)}`
          );
      }
      context.report(diagnostic);
    },

    TSInterfaceDeclaration(node) {
      if (preference !== "type") {
        return;
      }

      classification ??= moduleClassification(
        sourceCode.ast,
        context.filename,
        sourceCode.visitorKeys
      );
      if (hasAugmentationAncestor(node, classification)) {
        return;
      }

      const token = declarationKeyword(node);
      const diagnostic = {
        node: token,
        message: "Use `type` instead of `interface`.",
      };

      const range = [
        node.parent.type === "ExportDefaultDeclaration"
          ? node.parent.range[0]
          : token.range[0],
        node.range[1],
      ];
      const retainedRanges = [
        nameRange(node),
        node.body.range,
        ...node.extends.map((base) => base.range),
      ];

      if (
        !hasGlobalAncestor(node) &&
        !(classification === "ambiguous" && hasStringModuleAncestor(node)) &&
        !dropsComment(sourceCode, range, retainedRanges)
      ) {
        diagnostic.fix = (fixer) => {
          const name = declarationName(node);
          const extendsTypes = node.extends.map(
            (base) => ` & ${sourceCode.getText(base)}`
          );
          const declaration = `type ${name} = ${sourceCode.getText(node.body)}${extendsTypes.join("")}`;

          if (node.parent.type === "ExportDefaultDeclaration") {
            return fixer.replaceText(
              node.parent,
              `${declaration}\nexport default ${sourceCode.getText(node.id)}`
            );
          }

          return fixer.replaceTextRange(
            [token.range[0], node.range[1]],
            declaration
          );
        };
      }

      context.report(diagnostic);
    },
  };
}
