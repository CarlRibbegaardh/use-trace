import * as t from "@babel/types";
import { injectIntoBlockStatementDirect } from "./injectIntoBlockStatementDirect.js";

/**
 * Initiates injection of auto-tracing logic into a React component function.
 *
 * This function serves as the entry point for injecting tracing into a component
 * by delegating to the appropriate injection method based on the function type.
 *
 * @param path - Babel NodePath for the function declaration
 * @param componentName - Name of the React component
 * @param hookNameSet - Set of hook names to label
 * @param hookNameRegex - Regex pattern for hook names to label
 *
 * @internal
 */
export function injectUseAutoTracer(
  path: any,
  componentName: string,
  hookNameSet: Set<string>,
  hookNameRegex: RegExp | null
) {
  const func = path.node;
  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatementDirect(
      func.body,
      componentName,
      hookNameSet,
      hookNameRegex
    );
  }
}
