import type { TreeNode } from "../types/TreeNode.js";
import type { NonTrackedComponentVisibility } from "../../../interfaces/AutoTracerOptions.js";

/**
 * Options for controlling which nodes are considered visible vs empty.
 */
export interface EmptyNodeOptions {
  /**
   * Control visibility of reconciled non-tracked components.
   * When "never", Reconciled nodes without content are considered "empty" (filtered out).
   * Tracked components are always visible regardless of this setting.
   */
  readonly includeReconciled: NonTrackedComponentVisibility;

  /**
   * Control visibility of skipped non-tracked components.
   * When "never", Skipped nodes without content are considered "empty" (filtered out).
   * Tracked components are always visible regardless of this setting.
   */
  readonly includeSkipped: NonTrackedComponentVisibility;

  /**
   * Control visibility of mount non-tracked components.
   * When "never", Mount nodes (without tracking) are considered "empty" (filtered out).
   * Tracked mount nodes (isTracked=true) are always visible regardless of this setting.
   */
  readonly includeMount: NonTrackedComponentVisibility;

  /**
   * Control visibility of rendered (update phase) non-tracked components.
   * When "never", Rendering nodes (without tracking) are considered "empty" (filtered out).
   * Tracked rendering nodes (isTracked=true) are always visible regardless of this setting.
   */
  readonly includeRendered?: NonTrackedComponentVisibility;
}

/**
 * Determines if a TreeNode is considered "empty" based on visibility and content filtering.
 *
 * **Phase 1: Tracked Component Override**
 * - Tracked components (isTracked=true) are ALWAYS visible, never empty
 * - This takes precedence over all visibility settings
 *
 * **Phase 2: Marker Nodes**
 * - Marker nodes are never empty (they represent collapsed sequences)
 *
 * **Phase 3: Content-Based Visibility for Non-Tracked Components**
 * - Components with logs or warnings are always visible
 * - Visibility settings control display based on props/state content:
 *   - "never": Always hidden (empty), even with props/state
 *   - "forProps": Visible only if has props (propChanges.length > 0)
 *   - "forState": Visible only if has state (stateChanges.length > 0)
 *   - "forPropsOrState": Visible if has props OR state
 *   - "always": Always visible (not empty)
 *
 * @param node - The TreeNode to check
 * @param options - Visibility filtering options
 * @returns true if the node should be filtered out, false if it should be kept
 *
 * @example
 * ```typescript
 * // Tracked component is always visible, even with "never" setting
 * const tracked: TreeNode = { renderType: "Mount", isTracked: true, ... };
 * isEmptyNode(tracked, { includeMount: "never", ... }); // false (always visible)
 *
 * // Non-tracked Mount with props and "forProps" setting
 * const withProps: TreeNode = { renderType: "Mount", propChanges: [...], isTracked: false, ... };
 * isEmptyNode(withProps, { includeMount: "forProps", ... }); // false (visible)
 *
 * // Non-tracked Mount without props and "forProps" setting
 * const noProps: TreeNode = { renderType: "Mount", propChanges: [], isTracked: false, ... };
 * isEmptyNode(noProps, { includeMount: "forProps", ... }); // true (hidden)
 *
 * // Non-tracked with state and "never" setting
 * const withState: TreeNode = { renderType: "Mount", stateChanges: [...], isTracked: false, ... };
 * isEmptyNode(withState, { includeMount: "never", ... }); // true ("never" overrides content)
 * ```
 */
export function isEmptyNode(
  node: TreeNode,
  options: EmptyNodeOptions
): boolean {
  // Phase 1: Tracked components are ALWAYS visible
  if (node.isTracked) {
    return false; // Tracked nodes are never empty, always shown
  }

  // Phase 2: Marker nodes are never empty
  if (node.renderType === "Marker") {
    return false;
  }

  // Phase 3: Component logs always make node visible (override visibility)
  if (node.componentLogs.length > 0) {
    return false;
  }

  // Phase 4: Apply visibility filtering based on render type and content
  const hasProps = node.propChanges.length > 0;
  const hasState = node.stateChanges.length > 0;

  // Get visibility setting for this render type
  let visibilitySetting: NonTrackedComponentVisibility;
  if (node.renderType === "Reconciled") {
    visibilitySetting = options.includeReconciled;
  } else if (node.renderType === "Skipped") {
    visibilitySetting = options.includeSkipped;
  } else if (node.renderType === "Mount") {
    visibilitySetting = options.includeMount;
  } else if (node.renderType === "Rendering") {
    visibilitySetting = options.includeRendered ?? "never";
  } else {
    // Unknown render type: default to visible
    return false;
  }

  // Apply visibility logic based on setting
  // Identical value warnings do NOT override visibility - they respect the setting
  switch (visibilitySetting) {
    case "never":
      return true; // Always hidden (even with identical value warnings)

    case "forProps":
      return !hasProps; // Hidden if no props (identical value warnings don't matter)

    case "forState":
      return !hasState; // Hidden if no state (identical value warnings don't matter)

    case "forPropsOrState":
      return !hasProps && !hasState; // Hidden if no props AND no state

    case "always":
      return false; // Always visible

    default:
      // Defensive: treat unknown as "always"
      return false;
  }
}
