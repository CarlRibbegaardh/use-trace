/**
 * @file Value Equality Normalization
 *
 * Configurable stringify wrapper for autoTracer with function instance tracking
 * and stable key ordering for deterministic serialization.
 *
 * **Normalization Type**: Value Equality Normalization
 * - Functions → `"(fn:N)"` where N is unique per function instance
 * - Purpose: Preserve function instance distinctness for display/debugging
 * - Benefit: Shows when function instances change (f1 vs f2 distinguishable)
 *
 * **Related**: For structural comparison, use `normalizeValue` which converts
 * all functions to `"(fn)"` to enable structural matching across renders.
 *
 * @see {@link normalizeValue} for Structural Comparison Normalization
 * @see STRUCTURAL_MATCHING_BUGS.md for detailed explanation of normalization types
 */

import safeStringify from "safe-stable-stringify";

import { getFunctionId } from "./getFunctionId.js";
import { functionReplacer } from "./functionReplacer.js";

/**
 * Main stringify function used by autoTracer for display and debugging.
 *
 * Uses safe-stable-stringify for stable key ordering (alphabetically sorted).
 *
 * **Normalization Type**: Value Equality Normalization
 * - Each function instance → `"(fn:N)"` with unique N
 * - Enables: Display shows `{value: "x", fn: "(fn:1)"}` vs `{value: "y", fn: "(fn:2)"}`
 * - Preserves: Function instance information (fn1 vs fn2 distinguishable)
 *
 * **Warning**: This is NOT for structural comparison! Different function instances
 * will have different IDs, preventing structural matching. Use `normalizeValue` instead.
 *
 * Features:
 * - Function instance tracking via (fn:ID) format
 * - Handles circular references correctly
 * - Stable key ordering for deterministic serialization
 *
 * @param value - The value to stringify
 * @returns A string representation of the value with function instances tracked
 *
 * @example
 * ```typescript
 * const fn1 = () => {};
 * const fn2 = () => {};
 *
 * // Function instances get unique IDs
 * stringify({ onClick: fn1 })  // → '{"onClick":"(fn:1)"}'
 * stringify({ onClick: fn2 })  // → '{"onClick":"(fn:2)"}'
 * // Different IDs show these are different function instances
 *
 * // Same function instance gets same ID
 * stringify({ a: fn1, b: fn1 })  // → '{"a":"(fn:1)","b":"(fn:1)"}'
 * ```
 *
 * @see {@link normalizeValue} for structural comparison that treats all functions as equivalent
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
