import { traceOptions } from "../types/globalState.js";
import { logWarn } from "./log.js";
import { getTrackingGUID } from "./renderRegistry.js";

/**
 * Callback interface for visiting fiber nodes during traversal
 */
export interface FiberVisitor {
  /**
   * Called for each fiber node that should be processed
   * @param fiber - The fiber node
   * @param depth - Current depth in the tree
   * @returns boolean - true to continue traversing children, false to skip
   */
  visit(fiber: unknown, depth: number): boolean;
}

/**
 * Basic fiber node interface for type safety
 */
export interface FiberNode {
  elementType?: unknown;
  child?: unknown;
  sibling?: unknown;
  flags?: number;
  alternate?: unknown;
  memoizedProps?: Record<string, unknown>;
  pendingProps?: Record<string, unknown>;
  memoizedState?: unknown;
}

// Track the last depth we processed for connecting line visualization
let lastDepth = -1;

/**
 * Reset the depth tracking state
 */
export function resetDepthTracking(): void {
  lastDepth = -1;
}

/**
 * Get the current last processed depth
 */
export function getLastDepth(): number {
  return lastDepth;
}

/**
 * Update the last processed depth
 */
export function setLastDepth(depth: number): void {
  lastDepth = depth;
}

/**
 * Check if a fiber node is in the parent chain of any tracked component
 */
export function isInParentChainOfTracked(
  fiber: unknown,
  currentDepth: number
): boolean {
  // Check if any descendant at a deeper level is tracked
  function hasTrackedDescendant(node: unknown, depth: number): boolean {
    if (!node || typeof node !== "object") return false;

    const nodeAsFiber = node as FiberNode;

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
 * Walk a fiber tree and call the visitor for each node
 */
export function walkFiberTree(
  fiber: unknown,
  depth: number,
  visitor: FiberVisitor
): void {
  if (!fiber || typeof fiber !== "object") return;

  // Prevent infinite recursion - use configurable traversal depth limit
  const maxDepth = traceOptions.maxFiberDepth ?? 1000;
  if (depth > maxDepth) {
    logWarn(
      `AutoTracer: Maximum traversal depth (${maxDepth}) reached, stopping to prevent stack overflow`
    );
    return;
  }

  const fiberNode = fiber as FiberNode;

  // Visit the current node
  const shouldContinue = visitor.visit(fiber, depth);

  if (!shouldContinue) {
    return;
  }

  // Recursively walk child and sibling fibers
  if (fiberNode.child) {
    walkFiberTree(fiberNode.child, depth + 1, visitor);
  }
  if (fiberNode.sibling) {
    walkFiberTree(fiberNode.sibling, depth, visitor);
  }
}

/**
 * Utility function to check if a fiber should be skipped based on tracking
 */
export function shouldSkipFiber(
  fiber: unknown,
  depth: number,
  isTracked: boolean
): boolean {
  if (!traceOptions.skipNonTrackedBranches) {
    return false;
  }

  if (isTracked) {
    return false;
  }

  const isInParentChain = isInParentChainOfTracked(fiber, depth);
  return !isInParentChain;
}
