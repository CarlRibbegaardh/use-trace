/**
 * Configurable stringify wrapper for autoTracer
 */

import { stringify as jsonStringify } from "flatted";

/**
 * Main stringify function used by autoTracer
 */
export function stringify(value: unknown): string {
  try {
    if (typeof value === "object") {
      return jsonStringify(value);
    } else {
      return String(value);
    }
  } catch (error) {
    // Fallback to safe string representation on any error
    try {
      return `[Error serializing: ${error instanceof Error ? error.message : String(error)}]`;
    } catch {
      return "[Unserializable]";
    }
  }
}
