import type { TreeNode } from "../types/TreeNode.js";
import { renderIndentedNode } from "./renderIndentedNode.js";

/**
 * Renders a single TreeNode to the console.
 * Dispatches to the appropriate renderer based on configuration.
 *
 * IMPURE FUNCTION - Performs I/O (console logging).
 *
 * @param node - Tree node to render
 * @param visualDepth - Calculated visual depth for indentation
 * @param lastVisualDepth - Previous visual depth for connector logic
 * @param previousWasMarker - Whether the previous node was a marker
 * @param nextNode - The next node in the tree (for marker debug info)
 * @returns New lastVisualDepth value
 */
export function renderTreeNode(
  node: TreeNode,
  visualDepth: number,
  lastVisualDepth: number,
  previousWasMarker: boolean,
  nextNode?: TreeNode
): number {
  return renderIndentedNode(
    node,
    visualDepth,
    lastVisualDepth,
    previousWasMarker,
    nextNode
  );
}

