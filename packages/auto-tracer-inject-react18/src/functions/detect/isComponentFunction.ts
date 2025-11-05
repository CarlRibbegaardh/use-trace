import * as t from "@babel/types";
import { isPascalCase } from "./helpers/isPascalCase.js";
import { returnsJSX } from "./helpers/returnsJSX.js";

/**
 * isComponentFunction
 *
 * Returns true if the provided AST node represents a React component function.
 * Rules:
 * - FunctionDeclaration with a PascalCase identifier returning JSX
 * - VariableDeclarator with PascalCase identifier and FunctionExpression/ArrowFunctionExpression returning JSX
 */
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

// returnsJSX now imported from helpers
