import * as t from "@babel/types";
import type { ComponentInfo } from "../../interfaces/ComponentInfo.js";

/**
 * extractComponentInfo
 *
 * Given a Babel AST node for a component declaration, returns its name and metadata,
 * or null if it isn't a supported component declaration shape.
 */
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
