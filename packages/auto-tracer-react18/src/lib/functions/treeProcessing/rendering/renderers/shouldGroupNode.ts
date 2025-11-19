import type { TreeNode } from "../../types/TreeNode.js";

/**
 * Determines if a node should be rendered as a console group.
 * Pure decision function with no side effects.
 *
 * A node should be grouped if:
 * - It has visible child nodes, OR
 * - It has details to display (state changes, prop changes, or component logs)
 *
 * @param node - The tree node to evaluate
 * @param hasChildren - Whether the node has visible child nodes
 * @returns True if the node should be rendered as a group, false for a single log line
 */
export function shouldGroupNode(
  node: TreeNode,
  hasChildren: boolean,
): boolean {
  if (hasChildren) {
    return true;
  }

  // Check for details to display
  const hasDetails =
    node.stateChanges.length > 0 ||
    node.propChanges.length > 0 ||
    node.componentLogs.length > 0;

  return hasDetails;
}
