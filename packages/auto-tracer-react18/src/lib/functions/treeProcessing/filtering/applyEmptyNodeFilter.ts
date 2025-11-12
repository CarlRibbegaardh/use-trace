import type { TreeNode } from "../types/TreeNode.js";
import type { EmptyNodeOptions } from "./isEmptyNode.js";
import { filterFirstEmptyNodes } from "./filterFirstEmptyNodes.js";
import { filterAllEmptyNodes } from "./filterAllEmptyNodes.js";

/**
 * Filter mode for empty node filtering.
 * - "none": No filtering applied (identity function)
 * - "first": Filter only the initial sequence of empty nodes
 * - "all": Filter all empty node sequences throughout the tree
 */
export type FilterEmptyNodesMode = "none" | "first" | "all";

/**
 * Filter function type for tree node filtering.
 * Takes an array of TreeNodes and EmptyNodeOptions, returns filtered TreeNode array.
 */
export type TreeNodeFilterFn = (
  nodes: readonly TreeNode[],
  options: EmptyNodeOptions
) => readonly TreeNode[];

/**
 * Identity function that returns the input array unchanged.
 * Used for "none" mode to avoid any filtering overhead.
 *
 * @param nodes - The array of tree nodes
 * @returns The same array reference (identity)
 */
const identityFilter: TreeNodeFilterFn = (nodes) => {return nodes};

/**
 * Lookup table mapping filter modes to their corresponding filter functions.
 * This pattern ensures O(1) dispatch with zero cyclomatic complexity.
 *
 * - "none": Returns identity function (no filtering)
 * - "first": Returns filterFirstEmptyNodes (collapse initial sequence only)
 * - "all": Returns filterAllEmptyNodes (collapse all sequences)
 */
const FILTER_MODE_LOOKUP: Record<FilterEmptyNodesMode, TreeNodeFilterFn> = {
  none: identityFilter,
  first: filterFirstEmptyNodes,
  all: filterAllEmptyNodes,
};

/**
 * Returns the appropriate filter function for the specified empty node filter mode.
 *
 * This dispatcher uses a lookup table pattern to achieve ultra-low cyclomatic complexity (1).
 * No conditional branches are used - the mode string directly indexes into the lookup table.
 *
 * Modes:
 * - "none": No filtering (returns identity function)
 * - "first": Collapse only the initial sequence of empty nodes into a single marker
 * - "all": Collapse all empty node sequences throughout the tree into markers
 *
 * The returned function is pure and total:
 * - Pure: Same inputs always produce same outputs, no side effects
 * - Total: Handles all possible inputs without throwing exceptions
 *
 * Performance:
 * - O(1) lookup time
 * - Function references are reused (same mode returns same function reference)
 * - "none" mode has zero overhead (identity function)
 *
 * @param mode - The filter mode to apply ("none" | "first" | "all")
 * @returns A filter function that takes TreeNode array and EmptyNodeOptions and returns filtered array
 *
 * @example
 * ```typescript
 * // Get filter function for "first" mode
 * const filterFn = applyEmptyNodeFilter("first");
 * const filtered = filterFn(nodes, { includeReconciled: true, includeSkipped: true });
 * ```
 *
 * @example
 * ```typescript
 * // No filtering
 * const noFilter = applyEmptyNodeFilter("none");
 * const unchanged = noFilter(nodes, options); // Returns same reference
 * ```
 */
export function applyEmptyNodeFilter(
  mode: FilterEmptyNodesMode
): TreeNodeFilterFn {
  return FILTER_MODE_LOOKUP[mode];
}
