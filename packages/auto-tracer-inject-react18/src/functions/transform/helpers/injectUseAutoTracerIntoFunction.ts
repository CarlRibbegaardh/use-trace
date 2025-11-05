import * as t from "@babel/types";
import { injectIntoBlockStatementDirect } from "./injectIntoBlockStatementDirect.js";

export function injectUseAutoTracerIntoFunction(
  func: t.Function,
  componentName: string,
  hookNameSet: Set<string>,
  hookNameRegex: RegExp | null
) {
  // Convert arrow function expression body to block if needed
  if (t.isArrowFunctionExpression(func) && !t.isBlockStatement(func.body)) {
    const returnStatement = t.returnStatement(func.body);
    func.body = t.blockStatement([returnStatement]);
  }

  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatementDirect(
      func.body,
      componentName,
      hookNameSet,
      hookNameRegex
    );
  }
}
