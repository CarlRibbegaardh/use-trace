import type { TreeNode } from "../../types/TreeNode.js";

/**
 * Determines if a node should be rendered or skipped.
 * Pure predicate with no side effects.
 *
 * Marker nodes are only rendered when internals logging is enabled.
 * All other nodes are always rendered.
 *
 * @param node - The tree node to check
 * @param enableInternals - Whether internal/marker nodes should be visible
 * @returns True if the node should be rendered, false if it should be skipped
 */
export function shouldRenderNode(
  node: TreeNode,
  enableInternals: boolean
): boolean {
  if (node.renderType !== "Marker") {
    return true;
  }

  return enableInternals;
}
