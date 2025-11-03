import * as t from "@babel/types";

/**
 * returnsJSX
 *
 * Returns true if the given function node returns JSX (JSXElement or JSXFragment).
 */
export function returnsJSX(func: t.Function): boolean {
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
