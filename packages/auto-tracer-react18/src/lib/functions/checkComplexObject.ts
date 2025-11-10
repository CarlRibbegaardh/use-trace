import { walkObjectTree } from "./walkObjectTree.js";

/**
 * Check for complex objects by counting total nodes and depth.
 * Stops traversal if limits are exceeded to avoid performance issues.
 *
 * @param obj - Object to check
 * @returns Formatted string if object is too complex, null otherwise
 */
export function checkComplexObject(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  const MAX_NODES = 1000;
  const MAX_DEPTH = 20;
  const nodeCount = { count: 0 };
  const visited = new WeakSet<object>();

  const withinLimits = walkObjectTree(
    obj,
    0,
    nodeCount,
    visited,
    MAX_NODES,
    MAX_DEPTH
  );

  if (!withinLimits) {
    return `[Too large object to render. >${MAX_NODES} nodes]`;
  }

  return null;
}
