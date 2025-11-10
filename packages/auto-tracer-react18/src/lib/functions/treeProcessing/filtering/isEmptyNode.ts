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
 * Determines if a TreeNode is considered "empty" based on content-first filtering logic.
 *
 * **Phase 1: Content Filtering (takes precedence)**
 * - Nodes with state changes, prop changes, logs, tracking, or warnings are NEVER empty
 * - This ensures important information is always visible regardless of render type
 * - Marker nodes are NEVER empty
 *
 * **Phase 2: Visibility Filtering (only for nodes without content)**
 * - Reconciled nodes without content are empty when includeReconciled=false
 * - Skipped nodes without content are empty when includeSkipped=false
 * - Mount/Rendering nodes without content are always empty
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
 * // Skipped node WITH prop changes is visible even when includeSkipped=false
 * const skippedWithChanges: TreeNode = { renderType: "Skipped", propChanges: [...], ... };
 * isEmptyNode(skippedWithChanges, { includeReconciled: true, includeSkipped: false }); // false
 *
 * // Skipped node WITHOUT changes is filtered when includeSkipped=false
 * const skippedEmpty: TreeNode = { renderType: "Skipped", propChanges: [], ... };
 * isEmptyNode(skippedEmpty, { includeReconciled: true, includeSkipped: false }); // true
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
  // Phase 1: Content Filtering (takes precedence - nodes with content are NEVER empty)

  // Marker nodes are never empty
  if (node.renderType === "Marker") {
    return false;
  }

  // Check for content - if node has ANY content, it's not empty regardless of render type
  const hasContent =
    node.stateChanges.length > 0 ||
    node.propChanges.length > 0 ||
    node.componentLogs.length > 0 ||
    node.isTracked ||
    node.hasIdenticalValueWarning;

  if (hasContent) {
    return false; // Nodes with content are NEVER empty
  }

  // Phase 2: Visibility Filtering (only for nodes without content)

  // Reconciled nodes without content are filtered by includeReconciled
  if (node.renderType === "Reconciled" && !options.includeReconciled) {
    return true; // Filtered out by visibility
  }

  // Skipped nodes without content are filtered by includeSkipped
  if (node.renderType === "Skipped" && !options.includeSkipped) {
    return true; // Filtered out by visibility
  }

  // Reconciled/Skipped nodes without content but with visibility enabled are not empty
  if (node.renderType === "Reconciled" || node.renderType === "Skipped") {
    return false;
  }

  // Mount and Rendering nodes without content are empty
  return true;
}
