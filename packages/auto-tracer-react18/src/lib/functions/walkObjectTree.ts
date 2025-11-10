/**
 * Walk object tree depth-first, counting nodes.
 *
 * @param value - Value to walk
 * @param depth - Current depth in tree
 * @param nodeCount - Current node count (mutable counter object)
 * @param visited - WeakSet tracking visited objects for circular reference detection
 * @param maxNodes - Maximum allowed nodes
 * @param maxDepth - Maximum allowed depth
 * @returns false if limits exceeded, true otherwise
 */
export function walkObjectTree(
  value: unknown,
  depth: number,
  nodeCount: { count: number },
  visited: WeakSet<object>,
  maxNodes: number,
  maxDepth: number
): boolean {
  // Depth limit exceeded
  if (depth > maxDepth) {
    return false;
  }

  // Node count limit exceeded
  if (nodeCount.count > maxNodes) {
    return false;
  }

  nodeCount.count++;

  // Only walk objects and arrays
  if (typeof value !== "object" || value === null) {
    return true;
  }

  // Handle circular references
  if (visited.has(value)) {
    return true;
  }
  visited.add(value);

  // Walk all properties
  try {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propValue = (value as Record<string, unknown>)[key];
        if (!walkObjectTree(propValue, depth + 1, nodeCount, visited, maxNodes, maxDepth)) {
          return false;
        }
      }
    }
    return true;
  } catch {
    // Error walking object - assume too complex
    return false;
  }
}
