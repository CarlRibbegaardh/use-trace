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
  // Stack for iterative traversal to avoid recursion limits
  const stack = [{ value, depth }];

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;

    const { value: currValue, depth: currDepth } = item;

    // Depth limit exceeded
    if (currDepth > maxDepth) {
      return false;
    }

    // Node count limit exceeded
    if (nodeCount.count > maxNodes) {
      return false;
    }

    nodeCount.count++;

    // Only walk objects and arrays
    if (typeof currValue !== "object" || currValue === null) {
      continue;
    }

    // Handle circular references
    if (visited.has(currValue)) {
      continue;
    }
    visited.add(currValue);

    // Walk all properties
    try {
      // Use Object.keys for own properties (equivalent to for..in + hasOwnProperty)
      // Push in reverse order to maintain depth-first order (first key processed first)
      const keys = Object.keys(currValue);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        if (key === undefined) continue;
        const propValue = (currValue as Record<string, unknown>)[key];
        stack.push({ value: propValue, depth: currDepth + 1 });
      }
    } catch {
      // Error walking object - assume too complex
      return false;
    }
  }

  return true;
}
