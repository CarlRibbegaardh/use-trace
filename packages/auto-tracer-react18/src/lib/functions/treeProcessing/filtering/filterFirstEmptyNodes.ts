import type { TreeNode } from "../types/TreeNode.js";
import type { EmptyNodeOptions } from "./isEmptyNode.js";
import { isEmptyNode } from "./isEmptyNode.js";
import { createMarkerNode } from "./createMarkerNode.js";

/**
 * Filters the initial sequence of empty nodes from a tree, replacing them with a single marker.
 *
 * This function scans from the beginning of the array until it finds the first non-empty node.
 * If one or more empty nodes are found at the start, they are replaced with a single Marker node
 * that indicates how many levels were collapsed.
 *
 * **Behavior:**
 * - Scans from index 0 until first non-empty node
 * - Replaces initial empty sequence with single Marker node
 * - Preserves depth of first empty node in the marker
 * - Returns remaining nodes unchanged
 * - If all nodes are empty, returns single marker
 * - If no initial empty nodes, returns original array unchanged
 *
 * **Immutability:**
 * - Does not mutate input array
 * - Returns new array instance
 * - Reuses non-empty node references (structural sharing)
 *
 * @param nodes - Array of TreeNodes to filter
 * @param options - Visibility filtering options that determine which nodes are considered empty
 * @returns New array with initial empty sequence collapsed to marker
 *
 * @example
 * ```typescript
 * const nodes = [
 *   { depth: 0, ... }, // Empty
 *   { depth: 1, ... }, // Empty
 *   { depth: 2, stateChanges: [...], ... }, // Non-empty
 *   { depth: 3, ... }, // Empty (not filtered - only initial sequence)
 * ];
 *
 * const result = filterFirstEmptyNodes(nodes, options);
 * // [
 * //   { depth: 0, componentName: "... (2 empty levels)", renderType: "Marker", ... },
 * //   { depth: 2, stateChanges: [...], ... },
 * //   { depth: 3, ... },
 * // ]
 * ```
 */
export function filterFirstEmptyNodes(
  nodes: readonly TreeNode[],
  options: EmptyNodeOptions
): TreeNode[] {
  // Edge case: empty array
  if (nodes.length === 0) {
    return [];
  }

  // Get first node depth for marker creation
  // Array is guaranteed non-empty by check above
  const firstNodeDepth = nodes[0]?.depth ?? 0;

  // Find the index of the first non-empty node
  let firstNonEmptyIndex = 0;
  while (firstNonEmptyIndex < nodes.length) {
    const node = nodes[firstNonEmptyIndex];
    // Node exists due to loop condition, but use optional chaining for type safety
    if (node && !isEmptyNode(node, options)) {
      break;
    }
    firstNonEmptyIndex++;
  }

  // If no empty nodes at the start, return unchanged
  if (firstNonEmptyIndex === 0) {
    return [...nodes];
  }

  // If all nodes are empty, return single marker
  if (firstNonEmptyIndex === nodes.length) {
    return [createMarkerNode(firstNodeDepth, nodes.length)];
  }

  // Replace initial empty sequence with marker + remaining nodes
  const marker = createMarkerNode(firstNodeDepth, firstNonEmptyIndex);
  return [marker, ...nodes.slice(firstNonEmptyIndex)];
}
