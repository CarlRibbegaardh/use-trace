/**
 * Stringify for display in console with depth and breadth limits.
 */

import safeStringify from "safe-stable-stringify";
import { getFunctionId } from "./getFunctionId.js";
import { normalizeValueDeepWithIDs } from "./normalizeValueDeepWithIDs.js";

/**
 * Stringify for display in console.
 *
 * Uses safe-stable-stringify with limits to prevent DevTools from hanging.
 * Does NOT apply truncation - that's handled by the formatting layer.
 *
 * @param value - The value to stringify for display
 * @returns A string representation suitable for console display
 */
export function stringifyForDisplay(value: unknown): string {
  try {
    // Handle functions as primitives
    if (typeof value === "function") {
      const id = getFunctionId(value);
      return `(fn:${id})`;
    }

    // Handle primitives
    if (typeof value !== "object" || value === null) {
      return String(value);
    }

    // Deep normalize with ID tracking - replaces ALL functions at ALL levels
    // This eliminates the need for a replacer, preventing the 6+ second
    // performance issue while preserving function instance distinctness
    const normalized = normalizeValueDeepWithIDs(value);

    // Use safe-stable-stringify with depth/breadth limits for display with NO replacer
    const configured = safeStringify.configure({
      maximumDepth: 10,
      maximumBreadth: 50,
      circularValue: "[Circular]",
    });

    const result = configured(normalized) ?? "[Unserializable]";

    return result;
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
