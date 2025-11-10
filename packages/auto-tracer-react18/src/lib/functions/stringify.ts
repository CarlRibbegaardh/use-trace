/**
 * Configurable stringify wrapper for autoTracer with function identity tracking
 * and stable key ordering for deterministic serialization.
 */

import safeStringify from "safe-stable-stringify";

import { stringify as flattedStringify } from "flatted";
import { getFunctionId } from "./getFunctionId.js";
import { functionReplacer } from "./functionReplacer.js";

/**
 * Main stringify function used by autoTracer for display and matching.
 *
 * Uses safe-stable-stringify for stable key ordering (alphabetically sorted).
 *
 * Features:
 * - Function identity tracking via (fn:ID) format
 * - Handles circular references correctly
 * - Stable key ordering for deterministic serialization
 *
 * @param value - The value to stringify
 * @returns A string representation of the value
 */
export function stringify(value: unknown): string {
  try {
    // Handle functions as primitives BEFORE stringify to avoid JSON quoting
    if (typeof value === "function") {
      const id = getFunctionId(value);
      return `(fn:${id})`;
    }

    // Handle primitives
    if (typeof value !== "object" || value === null) {
      return String(value);
    }

    // Use safe-stable-stringify for stable key ordering
    const result = safeStringify(value, functionReplacer);

    return result ?? "[Unserializable]";
  } catch (error) {
    // Fallback to safe string representation on any error
    try {
      return `[Error serializing: ${
        error instanceof Error ? error.message : String(error)
      }]`;
    } catch {
      return "[Unserializable]";
    }
  }
}
