import * as t from "@babel/types";
import type { ComponentInfo } from "../interfaces/types.js";

export function isComponentFunction(node: t.Node): boolean {
  // Function declarations with PascalCase names
  if (t.isFunctionDeclaration(node) && node.id) {
    return isPascalCase(node.id.name) && returnsJSX(node);
  }

  // Variable declarators with function expressions
  if (t.isVariableDeclarator(node) && node.id && t.isIdentifier(node.id)) {
    const init = node.init;
    if (
      (t.isFunctionExpression(init) || t.isArrowFunctionExpression(init)) &&
      isPascalCase(node.id.name)
    ) {
      return returnsJSX(init);
    }
  }

  return false;
}

export function extractComponentInfo(node: t.Node): ComponentInfo | null {
  if (t.isFunctionDeclaration(node) && node.id) {
    return {
      name: node.id.name,
      isAnonymous: false,
      node,
      start: node.start ?? undefined,
      end: node.end ?? undefined,
    };
  }

  if (t.isVariableDeclarator(node) && node.id && t.isIdentifier(node.id)) {
    return {
      name: node.id.name,
      isAnonymous: false,
      node,
      start: node.start ?? undefined,
      end: node.end ?? undefined,
    };
  }

  return null;
}

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function returnsJSX(func: t.Function): boolean {
  let hasJSXReturn = false;

  // Handle concise arrow functions
  if (t.isArrowFunctionExpression(func) && !t.isBlockStatement(func.body)) {
    return t.isJSXElement(func.body) || t.isJSXFragment(func.body);
  }

  // Handle block statements
  if (t.isBlockStatement(func.body)) {
    for (const stmt of func.body.body) {
      if (t.isReturnStatement(stmt) && stmt.argument) {
        if (t.isJSXElement(stmt.argument) || t.isJSXFragment(stmt.argument)) {
          hasJSXReturn = true;
          break;
        }
      }
    }
  }

  return hasJSXReturn;
}

export function hasExistingUseAutoTracerImport(
  ast: t.File,
  importSource: string
): boolean {
  for (const stmt of ast.program.body) {
    if (t.isImportDeclaration(stmt) && stmt.source.value === importSource) {
      return stmt.specifiers.some(
        (
          spec:
            | t.ImportSpecifier
            | t.ImportDefaultSpecifier
            | t.ImportNamespaceSpecifier
        ) =>
          t.isImportSpecifier(spec) &&
          t.isIdentifier(spec.imported) &&
          spec.imported.name === "useAutoTracer"
      );
    }
  }
  return false;
}
