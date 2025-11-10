import type { TreeNode } from "../types/TreeNode.js";
import { buildTreeNode } from "./buildTreeNode.js";
import { traceOptions } from "../../../types/globalState.js";
import { getTrackingGUID } from "../../renderRegistry.js";

/**
 * Checks if a fiber node is in the parent chain of any tracked component.
 *
 * @param fiber - The fiber node to check
 * @param currentDepth - Current depth in traversal
 * @returns true if any descendant is tracked
 */
function isInParentChainOfTracked(
  fiber: unknown,
  currentDepth: number
): boolean {
  function hasTrackedDescendant(node: unknown, depth: number): boolean {
    if (!node || typeof node !== "object") return false;

    const nodeAsFiber = node as {
      elementType?: unknown;
      child?: unknown;
      sibling?: unknown;
    };

    // If this is a component and it's tracked, we found one
    if (nodeAsFiber.elementType && getTrackingGUID(node)) {
      return true;
    }

    // Check children
    if (
      nodeAsFiber.child &&
      hasTrackedDescendant(nodeAsFiber.child, depth + 1)
    ) {
      return true;
    }

    // Check siblings
    if (
      nodeAsFiber.sibling &&
      hasTrackedDescendant(nodeAsFiber.sibling, depth)
    ) {
      return true;
    }

    return false;
  }

  return hasTrackedDescendant(fiber, currentDepth);
}

/**
 * Internal recursive helper that builds TreeNodes into an accumulator array.
 *
 * Uses accumulator pattern to avoid exponential array spreading.
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
  if (depth > maxDepth) {
    return;
  }

  const fiberNode = fiber as {
    elementType?: unknown;
    child?: unknown;
    sibling?: unknown;
  };

  // If this is not a component node, continue traversal without creating a TreeNode
  if (!fiberNode.elementType) {
    buildTreeFromFiberInternal(fiberNode.child, depth + 1, accumulator);
    buildTreeFromFiberInternal(fiberNode.sibling, depth, accumulator);
    return;
  }

  // Check if we should skip non-tracked branches
  const isTracked = !!getTrackingGUID(fiber);
  if (!traceOptions.includeNonTrackedBranches && !isTracked) {
    // Only include if this component or any descendant is tracked
    if (!isInParentChainOfTracked(fiber, depth)) {
      // Skip this entire branch (no node, no children, continue with siblings)
      buildTreeFromFiberInternal(fiberNode.sibling, depth, accumulator);
      return;
    }
  }

  // Build the TreeNode for this fiber
  const node = buildTreeNode(fiber, depth);
  accumulator.push(node);

  // Recursively process children and siblings
  buildTreeFromFiberInternal(fiberNode.child, depth + 1, accumulator);
  buildTreeFromFiberInternal(fiberNode.sibling, depth, accumulator);
}

/**
 * Recursively builds an array of TreeNodes from a fiber tree.
 *
 * Uses internal accumulator to avoid exponential memory allocation.
 * Total function - handles all fiber structures safely.
 *
 * @param fiber - Root fiber node
 * @param depth - Starting depth (typically 0)
 * @returns Array of TreeNodes in depth-first order
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
