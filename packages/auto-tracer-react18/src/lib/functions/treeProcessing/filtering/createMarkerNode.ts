import type { TreeNode } from "../types/TreeNode.js";

/**
 * Creates a marker node representing collapsed empty levels.
 *
 * This is a pure factory function that creates immutable TreeNode instances
 * with renderType="Marker". Marker nodes have empty arrays for all change
 * collections and use "levels collapsed" text format (always plural).
 *
 * @param depth - The zero-based depth of the first collapsed level
 * @param count - The number of collapsed empty levels (must be positive)
 * @param filteredNodeCount - The count of nodes filtered (for debug mode)
 * @returns Immutable marker TreeNode with frozen arrays
 *
 * @example
 * ```typescript
 * const marker = createMarkerNode(5, 3, 3);
 * // marker.componentName === "... (3 levels collapsed)"
 * // marker.depth === 5
 * // marker.filteredNodeCount === 3
 * ```
 */
export function createMarkerNode(
  depth: number,
  count: number,
  filteredNodeCount: number
): TreeNode {
  const text = `... (${count} levels collapsed)`;

  return {
    depth,
    componentName: text,
    displayName: text,
    renderType: "Marker",
    flags: 0,
    stateChanges: Object.freeze([]),
    propChanges: Object.freeze([]),
    componentLogs: Object.freeze([]),
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
    filteredNodeCount,
  };
}
