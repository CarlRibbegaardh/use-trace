/**
 * @file Structural Stringify for Hot Path Optimization
 *
 * High-performance stringify variant that uses deep normalization to eliminate
 * the catastrophic performance issue from replacer callbacks.
 *
 * **Purpose**: Hot path for hook label resolution where we need structural
 * comparison (all functions treated as equivalent).
 *
 * **Performance**: By doing ONE deep normalization pass instead of thousands
 * of replacer callbacks, this eliminates 6+ seconds of blocking time and
 * prevents out-of-memory crashes.
 *
 * @see stringify-replacer-analysis.md for performance profiling evidence
 */

import safeStringify from "safe-stable-stringify";
import { normalizeValueDeep } from "./normalizeValueDeep.js";

/**
 * Stringify for structural comparison with deep normalization (hot path optimized).
 *
 * Pre-normalizes values using normalizeValueDeep (ALL functions → `"(fn)"` at all levels),
 * then serializes WITHOUT a replacer for maximum performance.
 *
 * This eliminates the 6+ second overhead and out-of-memory crashes caused by
 * replacer callbacks traversing deeply nested objects.
 *
 * **Use this for**: Hook label resolution where structural comparison is needed
 * **Do NOT use for**: Display/debugging where function instance IDs matter
 *
 * @param value - Value to stringify
 * @returns JSON string with all functions normalized to `"(fn)"` at all levels
 *
 * @example
 * ```typescript
 * const nested = {
 *   handler: () => {},
 *   deep: {
 *     callback: () => {}
 *   }
 * };
 *
 * stringifyStructural(nested)
 * // → '{"deep":{"callback":"(fn)"},"handler":"(fn)"}'
 * // All functions become "(fn)" regardless of identity or nesting
 * ```
 *
 * @see {@link stringify} for function identity tracking (slower, uses instance IDs)
 * @see {@link normalizeValueDeep} for the deep normalization implementation
 */
export function stringifyStructural(value: unknown): string {
  try {
    // Handle functions as primitives BEFORE normalization
    // Return the placeholder directly to match the format used in normalizeValue
    if (typeof value === "function") {
      return "(fn)";
    }

    // Handle primitives - return as string without JSON quoting
    if (typeof value !== "object" || value === null) {
      return String(value);
    }

    // Deep normalize first - replaces ALL functions at ALL levels with "(fn)"
    // This is the key optimization: ONE normalization pass instead of
    // thousands of replacer callback invocations
    const normalized = normalizeValueDeep(value);

    // Serialize with circular reference handling and NO replacer
    // This is what makes it fast - no callbacks, just direct serialization
    const configured = safeStringify.configure({
      circularValue: "[Circular]",
    });

    const result = configured(normalized);

    return result ?? "[Unserializable]";
  } catch (error) {
    try {
      return `[Error serializing: ${
        error instanceof Error ? error.message : String(error)
      }]`;
    } catch {
      return "[Unserializable]";
    }
  }
}
