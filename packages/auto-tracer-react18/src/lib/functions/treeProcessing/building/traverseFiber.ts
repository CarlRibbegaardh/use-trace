import type { TreeNode } from "../types/TreeNode.js";
import { buildTreeNode } from "./buildTreeNode.js";
import { traceOptions } from "../../../types/globalState.js";

/**
 * Frame representing a position in the explicit DFS traversal stack.
 *
 * @internal
 * @property fiber - The current fiber-like node to process
 * @property depth - Logical depth of the node used for limits and rendering
 */
interface TraversalFrame {
  fiber: unknown;
  depth: number;
}

/**
 * Traverses a fiber tree and builds TreeNodes for components that pass the filter.
 * Pure function with all dependencies explicitly passed as parameters.
 *
 * Uses stack-based iteration to avoid call stack overflow on deep fiber trees.
 * Processes nodes in depth-first order.
 *
 * @param fiber - Root fiber node to traverse
 * @param startDepth - Starting depth (typically 0)
 * @param shouldIncludeBranch - Predicate determining if a branch should be included
 * @param maxDepth - Maximum traversal depth to prevent infinite loops
 * @returns Array of TreeNodes in depth-first order
 */
export function traverseFiber(
  fiber: unknown,
  startDepth: number,
  shouldIncludeBranch: (fiber: unknown) => boolean,
  maxDepth: number,
): readonly TreeNode[] {
  const shouldLogDetail = traceOptions.enableAutoTracerInternalsLogging ?? false;
  if (shouldLogDetail) {
    console.group(`[AutoTracer] traverseFiber: ENTER (depth=${startDepth})`);
  }

  if (!fiber || typeof fiber !== "object") {
    if (shouldLogDetail) {
      console.log("[AutoTracer] traverseFiber: EXIT (invalid fiber)");
      console.groupEnd();
    }
    return [];
  }

  const accumulator: TreeNode[] = [];
  const stack: TraversalFrame[] = [{ fiber, depth: startDepth }];

  if (shouldLogDetail) {
    console.log(`[AutoTracer] traverseFiber: Starting loop with ${stack.length} items in stack`);
  }

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) continue;

    const { fiber: currentFiber, depth: currentDepth } = frame;

    if (shouldLogDetail) {
      console.log(`[AutoTracer] traverseFiber: Processing fiber at depth ${currentDepth}, stack size: ${stack.length}`);
    }

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

    // Check if we should include this branch
    if (!shouldIncludeBranch(currentFiber)) {
      // Skip this entire branch (no node, no children, continue with siblings)
      if (fiberNode.sibling) {
        stack.push({ fiber: fiberNode.sibling, depth: currentDepth });
      }
      continue;
    }

    // Build the TreeNode for this fiber
    if (shouldLogDetail) {
      console.log(`[AutoTracer] traverseFiber: Building node at depth ${currentDepth}`);
    }
    try {
      const node = buildTreeNode(currentFiber, currentDepth);
      accumulator.push(node);
      if (shouldLogDetail) {
        console.log(`[AutoTracer] traverseFiber: Successfully built node at depth ${currentDepth}`);
      }
    } catch (error) {
      if (shouldLogDetail) {
        console.error(
          `[AutoTracer] Error building node at depth ${currentDepth}:`,
          error
        );
      }
      // Continue traversal even if one node fails
    }

    // Push sibling and child to stack (sibling first for DFS order)
    if (fiberNode.sibling) {
      stack.push({ fiber: fiberNode.sibling, depth: currentDepth });
    }
    if (fiberNode.child) {
      stack.push({ fiber: fiberNode.child, depth: currentDepth + 1 });
    }
  }

  if (shouldLogDetail) {
    console.log(`[AutoTracer] traverseFiber: EXIT (${accumulator.length} nodes)`);
    console.groupEnd();
  }

  return accumulator;
}
