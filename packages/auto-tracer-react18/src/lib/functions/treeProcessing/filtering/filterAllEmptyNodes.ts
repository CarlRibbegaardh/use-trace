import type { TreeNode } from "../types/TreeNode.js";
import type { EmptyNodeOptions } from "./isEmptyNode.js";
import { isEmptyNode } from "./isEmptyNode.js";
import { createMarkerNode } from "./createMarkerNode.js";

/**
 * Accumulator state for the reduce operation.
 * Tracks the result array and the current empty sequence being built.
 */
interface FilterState {
  /**
   * Accumulated result nodes (includes markers for completed sequences).
   */
  readonly result: TreeNode[];

  /**
   * Current empty sequence being accumulated.
   * Null when not currently in an empty sequence.
   */
  readonly currentEmptySequence: {
    readonly startDepth: number;
    readonly count: number;
  } | null;
}

/**
 * Filters all empty node sequences from a tree, replacing each with a single marker.
 *
 * This function scans the entire array and replaces every contiguous sequence of empty nodes
 * with a single Marker node. Unlike filterFirstEmptyNodes which only processes the initial
 * sequence, this handles all sequences throughout the tree.
 *
 * **Algorithm:**
 * - Uses reduce to accumulate results and track empty sequences
 * - When encountering an empty node, adds it to current sequence
 * - When encountering a non-empty node, flushes current sequence as marker
 * - At the end, flushes any remaining empty sequence
 *
 * **Behavior:**
 * - Replaces each empty sequence with single Marker node
 * - Preserves all non-empty nodes unchanged
 * - Preserves depth of first empty node in each sequence
 * - If all nodes are empty, returns single marker
 * - If no nodes are empty, returns copy of original array
 *
 * **Immutability:**
 * - Does not mutate input array
 * - Returns new array instance
 * - Reuses non-empty node references (structural sharing)
 *
 * @param nodes - Array of TreeNodes to filter
 * @param options - Visibility filtering options that determine which nodes are considered empty
 * @returns New array with all empty sequences collapsed to markers
 *
 * @example
 * ```typescript
 * const nodes = [
 *   { depth: 0, ... }, // Empty
 *   { depth: 1, ... }, // Empty
 *   { depth: 2, stateChanges: [...], ... }, // Non-empty
 *   { depth: 3, ... }, // Empty
 *   { depth: 4, ... }, // Empty
 * ];
 *
 * const result = filterAllEmptyNodes(nodes, options);
 * // [
 * //   { depth: 0, componentName: "... (2 empty levels)", renderType: "Marker", ... },
 * //   { depth: 2, stateChanges: [...], ... },
 * //   { depth: 3, componentName: "... (2 empty levels)", renderType: "Marker", ... },
 * // ]
 * ```
 */
export function filterAllEmptyNodes(
  nodes: readonly TreeNode[],
  options: EmptyNodeOptions
): TreeNode[] {
  // Edge case: empty array
  if (nodes.length === 0) {
    return [];
  }

  /**
   * Flushes the current empty sequence to the result array as a marker.
   * If no sequence is in progress, returns state unchanged.
   */
  const flushEmptySequence = (state: FilterState): FilterState => {
    if (state.currentEmptySequence === null) {
      return state;
    }

    const marker = createMarkerNode(
      state.currentEmptySequence.startDepth,
      state.currentEmptySequence.count
    );

    return {
      result: [...state.result, marker],
      currentEmptySequence: null,
    };
  };

  // Reduce over nodes, accumulating result and tracking empty sequences
  const finalState = nodes.reduce<FilterState>(
    (state, node) => {
      if (isEmptyNode(node, options)) {
        // Node is empty: add to current sequence or start new sequence
        if (state.currentEmptySequence === null) {
          // Start new empty sequence
          return {
            ...state,
            currentEmptySequence: {
              startDepth: node.depth,
              count: 1,
            },
          };
        } else {
          // Continue current sequence
          return {
            ...state,
            currentEmptySequence: {
              ...state.currentEmptySequence,
              count: state.currentEmptySequence.count + 1,
            },
          };
        }
      } else {
        // Node is non-empty: flush sequence and add node
        const flushedState = flushEmptySequence(state);
        return {
          result: [...flushedState.result, node],
          currentEmptySequence: null,
        };
      }
    },
    { result: [], currentEmptySequence: null }
  );

  // Flush any remaining empty sequence at the end
  const completedState = flushEmptySequence(finalState);

  return completedState.result;
}
