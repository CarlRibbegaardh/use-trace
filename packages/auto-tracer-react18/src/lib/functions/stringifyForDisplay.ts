/**
 * Stringify for display in console with depth and breadth limits.
 */

import safeStringify from "safe-stable-stringify";
import { getFunctionId } from "./getFunctionId.js";
import { functionReplacer } from "./functionReplacer.js";

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

    // Use safe-stable-stringify with depth/breadth limits for display
    const configured = safeStringify.configure({
      maximumDepth: 10,
      maximumBreadth: 50,
      circularValue: "[Circular]",
    });

    const result = configured(value, functionReplacer) ?? "[Unserializable]";

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
