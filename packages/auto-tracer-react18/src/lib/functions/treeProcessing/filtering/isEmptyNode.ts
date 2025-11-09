import type { TreeNode } from "../types/TreeNode.js";

/**
 * Options for controlling which nodes are considered visible vs empty.
 */
export interface EmptyNodeOptions {
  /**
   * Whether to include reconciled nodes in output.
   * When false, Reconciled nodes are considered "empty" (filtered out).
   */
  readonly includeReconciled: boolean;

  /**
   * Whether to include skipped nodes in output.
   * When false, Skipped nodes are considered "empty" (filtered out).
   */
  readonly includeSkipped: boolean;
}

/**
 * Determines if a TreeNode is considered "empty" based on two-phase filtering logic.
 *
 * **Phase 1: Visibility Filtering (takes precedence)**
 * - Reconciled nodes are empty when includeReconciled=false
 * - Skipped nodes are empty when includeSkipped=false
 * - This phase short-circuits before content checking
 *
 * **Phase 2: Content Filtering (only for visible nodes)**
 * - Mount/Rendering nodes are empty when they have no changes, logs, tracking, or warnings
 * - Reconciled/Skipped nodes are NEVER empty when visible (phase 1 passed)
 * - Marker nodes are NEVER empty
 *
 * Content indicators (any makes node non-empty):
 * - stateChanges.length > 0
 * - propChanges.length > 0
 * - componentLogs.length > 0
 * - isTracked === true
 * - hasIdenticalValueWarning === true
 *
 * @param node - The TreeNode to check
 * @param options - Visibility filtering options
 * @returns true if the node should be filtered out, false if it should be kept
 *
 * @example
 * ```typescript
 * // Reconciled node filtered by visibility
 * const reconciled: TreeNode = { renderType: "Reconciled", ... };
 * isEmptyNode(reconciled, { includeReconciled: false, includeSkipped: true }); // true
 *
 * // Mount node with no changes is empty
 * const mount: TreeNode = { renderType: "Mount", stateChanges: [], ... };
 * isEmptyNode(mount, { includeReconciled: true, includeSkipped: true }); // true
 *
 * // Rendering node with changes is not empty
 * const rendering: TreeNode = { renderType: "Rendering", stateChanges: [...], ... };
 * isEmptyNode(rendering, { includeReconciled: true, includeSkipped: true }); // false
 * ```
 */
export function isEmptyNode(
  node: TreeNode,
  options: EmptyNodeOptions
): boolean {
  // Phase 1: Visibility Filtering (short-circuits before content check)
  if (node.renderType === "Reconciled" && !options.includeReconciled) {
    return true; // Filtered out by visibility
  }

  if (node.renderType === "Skipped" && !options.includeSkipped) {
    return true; // Filtered out by visibility
  }

  // Phase 2: Content Filtering (only reached if node is visible)

  // Marker nodes are never empty
  if (node.renderType === "Marker") {
    return false;
  }

  // Reconciled and Skipped nodes are never empty when visible
  if (node.renderType === "Reconciled" || node.renderType === "Skipped") {
    return false;
  }

  // Mount and Rendering nodes: check for content
  const hasContent =
    node.stateChanges.length > 0 ||
    node.propChanges.length > 0 ||
    node.componentLogs.length > 0 ||
    node.isTracked ||
    node.hasIdenticalValueWarning;

  return !hasContent; // Empty if no content
}
