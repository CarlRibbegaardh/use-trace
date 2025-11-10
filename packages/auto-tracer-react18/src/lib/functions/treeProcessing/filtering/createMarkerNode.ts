import type { TreeNode } from "../types/TreeNode.js";

/**
 * Creates a marker node representing collapsed empty levels.
 *
 * This is a pure factory function that creates immutable TreeNode instances
 * with renderType="Marker". Marker nodes have empty arrays for all change
 * collections and proper singular/plural formatting.
 *
 * @param depth - The zero-based depth of the first collapsed level
 * @param count - The number of collapsed empty levels (must be positive)
 * @returns Immutable marker TreeNode with frozen arrays
 *
 * @example
 * ```typescript
 * const marker = createMarkerNode(5, 3);
 * // marker.componentName === "... (3 empty levels)"
 * // marker.depth === 5
 * ```
 */
export function createMarkerNode(depth: number, count: number): TreeNode {
  const text =
    count === 1 ? "... (1 empty level)" : `... (${count} empty levels)`;

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
  };
}
