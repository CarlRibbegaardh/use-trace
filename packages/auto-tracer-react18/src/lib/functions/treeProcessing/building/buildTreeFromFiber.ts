import type { TreeNode } from "../types/TreeNode.js";
import { buildTreeNode } from "./buildTreeNode.js";
import { traceOptions } from "../../../types/globalState.js";
import { getTrackingGUID } from "../../renderRegistry.js";

/**
 * Checks whether the subtree rooted at a fiber contains any tracked component.
 *
 * Iterative depth-first search to avoid call stack growth on deep trees.
 *
 * @param fiber - The fiber node that acts as the subtree root
 * @returns True if any descendant in the subtree is tracked; otherwise false
 */
function hasTrackedDescendant(fiber: unknown): boolean {
  if (!fiber || typeof fiber !== "object") return false;

  // Stack-based iterative traversal to avoid recursion depth issues
  const stack: unknown[] = [fiber];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    const nodeAsFiber = node as {
      elementType?: unknown;
      child?: unknown;
      sibling?: unknown;
    };

    // If this is a component and it's tracked, we found one
    if (nodeAsFiber.elementType && getTrackingGUID(node)) {
      return true;
    }

    // Push siblings and children to stack (sibling first for DFS order)
    if (nodeAsFiber.sibling) {
      stack.push(nodeAsFiber.sibling);
    }
    if (nodeAsFiber.child) {
      stack.push(nodeAsFiber.child);
    }
  }

  return false;
}

/**
 * Frame representing a position in the explicit DFS traversal stack.
 *
 * @internal
 * @remarks Mirrors the parameters used by the prior recursive form so that
 * the depth calculation and traversal order remain identical while avoiding
 * recursion.
 *
 * @property fiber - The current fiber-like node to process
 * @property depth - Logical depth of the node used for limits and rendering
 */
interface TraversalFrame {
  fiber: unknown;
  depth: number;
}

/**
 * Internal iterative helper that builds TreeNodes into an accumulator array.
 *
 * Uses explicit stack-based iteration to avoid stack overflow on deep fiber trees.
 * Processes nodes in depth-first order matching the original recursive behavior.
 *
 * @param fiber - Current fiber node
 * @param depth - Current depth in the tree
 * @param accumulator - Mutable array to accumulate results
 */
function buildTreeFromFiberInternal(
  fiber: unknown,
  depth: number,
  accumulator: TreeNode[]
): void {
  if (!fiber || typeof fiber !== "object") {
    return;
  }

  // Prevent infinite recursion - use configurable traversal depth limit
  const maxDepth = traceOptions.maxFiberDepth ?? 1000;

  // Stack-based iterative traversal to avoid call stack overflow
  const stack: TraversalFrame[] = [{ fiber, depth }];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) continue;

    const { fiber: currentFiber, depth: currentDepth } = frame;

    if (!currentFiber || typeof currentFiber !== "object") {
      continue;
    }

    // Prevent infinite traversal
    if (currentDepth > maxDepth) {
      continue;
    }

    const fiberNode = currentFiber as {
      elementType?: unknown;
      child?: unknown;
      sibling?: unknown;
    };

    // If this is not a component node, continue traversal without creating a TreeNode
    if (!fiberNode.elementType) {
      // Push sibling first (will be processed after child due to LIFO stack)
      if (fiberNode.sibling) {
        stack.push({ fiber: fiberNode.sibling, depth: currentDepth });
      }
      if (fiberNode.child) {
        stack.push({ fiber: fiberNode.child, depth: currentDepth + 1 });
      }
      continue;
    }

    // Check if we should skip non-tracked branches
    const isTracked = !!getTrackingGUID(currentFiber);
    if (!traceOptions.includeNonTrackedBranches && !isTracked) {
      // Only include if this component or any descendant is tracked
      if (!hasTrackedDescendant(currentFiber)) {
        // Skip this entire branch (no node, no children, continue with siblings)
        if (fiberNode.sibling) {
          stack.push({ fiber: fiberNode.sibling, depth: currentDepth });
        }
        continue;
      }
    }

    // Build the TreeNode for this fiber
    const node = buildTreeNode(currentFiber, currentDepth);
    accumulator.push(node);

    // Push sibling and child to stack (sibling first for DFS order)
    if (fiberNode.sibling) {
      stack.push({ fiber: fiberNode.sibling, depth: currentDepth });
    }
    if (fiberNode.child) {
      stack.push({ fiber: fiberNode.child, depth: currentDepth + 1 });
    }
  }
}

/**
 * Iteratively builds an array of `TreeNode`s from a fiber tree.
 *
 * Uses an internal accumulator and an explicit stack to avoid recursion and
 * prevent call stack overflows on deep component hierarchies. Total function
 * — handles all fiber structures safely.
 *
 * @param fiber - Root fiber node
 * @param depth - Starting depth (typically 0)
 * @returns Array of `TreeNode`s in depth-first order
 */
export function buildTreeFromFiber(
  fiber: unknown,
  depth: number
): readonly TreeNode[] {
  const shouldLogTiming =
    traceOptions.enableAutoTracerInternalsLogging ?? false;
  const startTime = shouldLogTiming ? performance.now() : 0;

  const accumulator: TreeNode[] = [];
  buildTreeFromFiberInternal(fiber, depth, accumulator);

  if (shouldLogTiming) {
    const duration = performance.now() - startTime;
    console.log(
      `[AutoTracer] buildTreeFromFiber: ${
        accumulator.length
      } nodes in ${duration.toFixed(2)}ms`
    );
  }

  return accumulator;
}
