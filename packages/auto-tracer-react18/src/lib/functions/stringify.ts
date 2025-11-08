/**
 * Configurable stringify wrapper for autoTracer with function identity tracking
 * and stable key ordering for deterministic serialization.
 */

import safeStringify from "safe-stable-stringify";

/**
 * WeakMap to track function identities across stringifications.
 * Maps function references to unique numeric IDs.
 */
const functionIdMap = new WeakMap<Function, number>();

/**
 * Counter for generating unique function IDs.
 */
let nextFunctionId = 1;

/**
 * Gets or assigns a unique numeric ID for a function.
 * Same function reference always gets the same ID.
 * Different function instances get different IDs.
 *
 * @param fn - The function to get an ID for
 * @returns The numeric ID for this function
 */
function getFunctionId(fn: Function): number {
  const existing = functionIdMap.get(fn);
  if (existing !== undefined) {
    return existing;
  }

  const id = nextFunctionId++;
  functionIdMap.set(fn, id);
  return id;
}

/**
 * Main stringify function used by autoTracer.
 *
 * Features:
 * - Stable key ordering for objects (alphabetical)
 * - Function identity tracking via (fn:ID) format
 * - Deterministic serialization for identical value detection
 * - Safe handling of circular references and edge cases
 *
 * @param value - The value to stringify
 * @returns A string representation of the value
 */
export function stringify(value: unknown): string {
  try {
    // Handle functions as primitives BEFORE safeStringify to avoid JSON quoting
    if (typeof value === "function") {
      const id = getFunctionId(value);
      return `(fn:${id})`;
    }

    // Handle primitives
    if (typeof value !== "object" || value === null) {
      return String(value);
    }

    // Handle objects/arrays with stable key ordering
    // Use safe-stable-stringify for deterministic output
    const result = safeStringify(value, (key, val) => {
      // Replace functions in objects/arrays with (fn:ID) markers
      if (typeof val === "function") {
        const id = getFunctionId(val);
        return `(fn:${id})`;
      }
      return val;
    });

    // safeStringify can return undefined for values it cannot serialize
    return result ?? "[Unserializable]";
  } catch (error) {
    // Fallback to safe string representation on any error
    try {
      return `[Error serializing: ${error instanceof Error ? error.message : String(error)}]`;
    } catch {
      return "[Unserializable]";
    }
  }
}
