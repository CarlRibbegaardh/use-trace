import type { StateValue } from "../../../interfaces/StateValue.js";
import type { PropChange } from "../../../interfaces/PropChange.js";
import type { ComponentLogEntry } from "../../../interfaces/ComponentLogger.js";

/**
 * Represents the type of render operation for a tree node.
 *
 * - "Mount": Initial render of a component
 * - "Rendering": Component re-rendered with changes
 * - "Reconciled": React evaluated but didn't re-render
 * - "Skipped": React did internal work but didn't execute component function
 * - "Marker": Special node representing collapsed empty levels
 */
export type RenderType =
  | "Mount"
  | "Rendering"
  | "Reconciled"
  | "Skipped"
  | "Marker";

/**
 * Immutable representation of a fiber node with all extracted information.
 *
 * TreeNode is the core data structure for the tree processing pipeline.
 * It contains all information needed for filtering and rendering, extracted
 * from React fiber nodes.
 *
 * Key invariants:
 * - All fields are readonly (immutable)
 * - depth refers to original fiber depth (zero-based, never renumbered)
 * - renderType encodes mount status (no separate isMount field needed)
 * - Marker nodes have empty arrays for all change collections
 *
 * @see RenderType for explanation of render operation types
 */
export interface TreeNode {
  /**
   * Zero-based depth in the original fiber tree.
   * Never modified by filtering operations.
   */
  readonly depth: number;

  /**
   * Component name extracted from fiber.
   * For markers, contains text like "... (5 empty levels)".
   */
  readonly componentName: string;

  /**
   * Display name for rendering.
   * Usually same as componentName, may differ for special cases.
   */
  readonly displayName: string;

  /**
   * Type of render operation.
   * Encodes whether this is a mount, update, reconciliation, skip, or marker.
   */
  readonly renderType: RenderType;

  /**
   * React fiber flags bitfield.
   * Used for debugging React's internal operations.
   */
  readonly flags: number;

  /**
   * Immutable array of state changes detected in this render.
   * Empty for reconciled, skipped, and marker nodes.
   */
  readonly stateChanges: readonly StateValue[];

  /**
   * Immutable array of prop changes detected in this render.
   * Empty for reconciled, skipped, and marker nodes.
   */
  readonly propChanges: readonly PropChange[];

  /**
   * Immutable array of component log statements from this render.
   * Empty for reconciled, skipped, and marker nodes.
   */
  readonly componentLogs: readonly ComponentLogEntry[];

  /**
   * Whether this component uses the useAutoTracer() hook.
   * Tracked components are never considered "empty".
   */
  readonly isTracked: boolean;

  /**
   * Unique identifier for tracked components.
   * Null for non-tracked components.
   */
  readonly trackingGUID: string | null;

  /**
   * Whether this node has identical value change warnings.
   * Indicates new object/array/function reference with identical content.
   * Nodes with warnings are never considered "empty".
   */
  readonly hasIdenticalValueWarning: boolean;
}
