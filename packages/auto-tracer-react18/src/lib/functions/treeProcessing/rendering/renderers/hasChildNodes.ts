import type { TreeNode } from "../../types/TreeNode.js";
import { shouldRenderNode } from "./shouldRenderNode.js";

/**
 * Determines if a node has visible child nodes.
 * Pure lookahead function with explicit dependencies.
 *
 * Looks ahead to find the next visible (non-skipped) node and checks
 * if it is deeper than the current node, indicating a parent-child relationship.
 *
 * @param nodes - Complete array of tree nodes
 * @param currentIndex - Index of the node to check for children
 * @param enableInternals - Whether internal/marker nodes are visible
 * @returns True if the node has at least one visible child
 */
export function hasChildNodes(
  nodes: readonly TreeNode[],
  currentIndex: number,
  enableInternals: boolean,
): boolean {
  const currentNode = nodes[currentIndex];
  if (!currentNode) {
    return false;
  }

  // Look ahead for the next visible node
  for (let i = currentIndex + 1; i < nodes.length; i++) {
    const candidateNode = nodes[i];
    if (!candidateNode) {
      continue;
    }

    // Skip nodes that won't be rendered
    if (!shouldRenderNode(candidateNode, enableInternals)) {
      continue;
    }

    // First visible node found - is it deeper?
    return candidateNode.depth > currentNode.depth;
  }

  // No visible nodes found after current
  return false;
}
