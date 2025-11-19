/**
 * Checks whether a fiber or any of its descendants is tracked.
 * Pure function with explicit GUID lookup dependency.
 *
 * Uses iterative depth-first search to avoid call stack growth on deep trees.
 *
 * @param fiber - The fiber node to check
 * @param getGUID - Function to retrieve tracking GUID for a fiber (explicit dependency)
 * @returns True if fiber or any descendant is tracked
 */
export function isTrackedBranch(
  fiber: unknown,
  getGUID: (fiber: unknown) => string | null,
): boolean {
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
    if (nodeAsFiber.elementType && getGUID(node)) {
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
