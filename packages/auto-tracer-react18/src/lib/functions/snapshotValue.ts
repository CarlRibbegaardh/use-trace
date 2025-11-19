import { getFunctionId } from "./getFunctionId.js";

/**
 * Creates a safe, deep clone of a value for logging/debugging.
 *
 * Features:
 * - Iterative traversal (stack-based) to avoid recursion limits.
 * - Replaces functions with "(fn:ID)" strings.
 * - Handles circular references by replacing them with "[Circular]".
 * - Respects maxNodes and maxDepth limits to prevent OOM/hangs.
 * - Converts DAGs to trees (clones shared references) to ensure safety.
 *
 * @param value - The value to snapshot.
 * @param maxNodes - Maximum number of nodes to process (default 1000).
 * @param maxDepth - Maximum depth to traverse (default 20).
 * @returns A safe clone of the value.
 */
export function snapshotValue(
  value: unknown,
  maxNodes = 1000,
  maxDepth = 20
): unknown {
  // Handle primitives and functions at the root level immediately
  if (typeof value === "function") {
    return `(fn:${getFunctionId(value)})`;
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Root is an object/array. Initialize the clone.
  const rootClone = Array.isArray(value) ? [] : {};

  // Stack for iterative traversal.
  interface StackItem {
    source: unknown;
    target: unknown;
    depth: number;
    ancestors?: Set<unknown>;
  }

  const stack: StackItem[] = [{ source: value, target: rootClone, depth: 0 }];

  let nodeCount = 0;

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;

    const { source, target, depth, ancestors } = item;

    // Check limits
    if (depth > maxDepth) {
      if (!Array.isArray(target)) {
         (target as Record<string, unknown>)["[Max Depth]"] = true;
      }
      continue;
    }

    if (nodeCount > maxNodes) {
       continue;
    }
    nodeCount++;

    // Iterate keys
    const keys = Object.keys(source as object);

    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (key === undefined) continue;

      const value = (source as Record<string, unknown>)[key];

      // Check node limit before processing property
      if (nodeCount >= maxNodes) {
         (target as Record<string, unknown>)["[Max Nodes]"] = true;
         break;
      }

      // 1. Handle Primitives & Functions
      if (typeof value === "function") {
        nodeCount++;
        (target as Record<string, unknown>)[key] = `(fn:${getFunctionId(value)})`;
        continue;
      }

      if (typeof value !== "object" || value === null) {
        nodeCount++;
        (target as Record<string, unknown>)[key] = value;
        continue;
      }

      // 2. Handle Objects
      // Check limits before creating new object
      if (depth + 1 > maxDepth) {
         (target as Record<string, unknown>)[key] = "[Max Depth]";
         continue;
      }

      // Check circularity using ancestors
      const currentAncestors = ancestors || new Set();
      currentAncestors.add(source);

      if (currentAncestors.has(value)) {
        (target as Record<string, unknown>)[key] = "[Circular]";
        continue;
      }

      // Create new clone
      const newClone = Array.isArray(value) ? [] : {};
      (target as Record<string, unknown>)[key] = newClone;

      // Push to stack
      stack.push({
        source: value,
        target: newClone,
        depth: depth + 1,
        ancestors: new Set(currentAncestors)
      });
    }
  }

  return rootClone;
}
