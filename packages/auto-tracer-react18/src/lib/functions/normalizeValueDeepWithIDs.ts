/**
 * @file Deep Normalization with Function Identity Tracking
 *
 * Recursively normalizes values by replacing ALL functions at ALL nesting levels
 * with unique identity strings `(fn:N)`. This enables calling safeStringify without
 * a replacer while preserving function instance information.
 *
 * **Difference from normalizeValueDeep:**
 * - `normalizeValueDeep` → all functions become `"(fn)"` (structural comparison)
 * - `normalizeValueDeepWithIDs` → functions become `"(fn:1)"`, `"(fn:2)"` etc (instance tracking)
 *
 * @see {@link normalizeValueDeep} for structural comparison (all functions equivalent)
 */

import { getFunctionId } from "./getFunctionId.js";

/**
 * Deeply normalizes a value with function instance ID tracking.
 *
 * Recursively traverses nested objects and arrays, replacing ALL functions
 * at ALL levels with unique identity strings like `"(fn:1)"`, `"(fn:2)"`.
 *
 * This enables stringify to work WITHOUT a replacer (eliminating the 6+ second
 * performance issue) while still preserving function instance distinctness.
 *
 * **Circular References**: Automatically detected and stopped to prevent stack overflow.
 * The original circular object reference is passed through (safe-stable-stringify
 * will handle it via `circularValue` option).
 *
 * **Special Objects** (Date, RegExp, Error, etc.): Passed through unchanged.
 * These have `.toJSON()` methods or special serialization, so safe-stable-stringify
 * handles them correctly.
 *
 * @param value - Value to normalize (may be deeply nested)
 * @param visited - Internal: tracks visited objects to detect circular references
 * @returns Normalized value with all functions replaced by identity strings
 *
 * @example
 * ```typescript
 * const fn1 = () => {};
 * const fn2 = () => {};
 * const nested = {
 *   handler: fn1,
 *   deep: {
 *     callback: fn2,
 *     another: fn1  // Same function as handler
 *   }
 * };
 *
 * normalizeValueDeepWithIDs(nested)
 * // Returns:
 * // {
 * //   handler: "(fn:1)",
 * //   deep: {
 * //     callback: "(fn:2)",
 * //     another: "(fn:1)"
 * //   }
 * // }
 * ```
 *
 * @see {@link normalizeValueDeep} for structural comparison (all `(fn)`)
 * @see {@link getFunctionId} for function identity tracking
 */
export function normalizeValueDeepWithIDs(
  value: unknown,
  visited: WeakSet<object> = new WeakSet(),
): unknown {
  // Handle functions FIRST (before object check, since functions are objects in JS)
  if (typeof value === "function") {
    const id = getFunctionId(value);
    return `(fn:${id})`;
  }

  // Handle primitives and null
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Detect circular references - pass through original (let safe-stable-stringify handle it)
  if (visited.has(value)) {
    return value;
  }

  // Special objects (Date, RegExp, Error, etc.) - pass through unchanged
  // These have .toJSON() or special JSON.stringify behavior
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) {
    return value;
  }

  // Mark as visited BEFORE recursing (prevents infinite loops)
  visited.add(value);

  // Handle arrays - recursively normalize elements
  if (Array.isArray(value)) {
    return value.map((item) => {
      return normalizeValueDeepWithIDs(item, visited);
    });
  }

  // Handle plain objects - recursively normalize properties
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    normalized[key] = normalizeValueDeepWithIDs(val, visited);
  }
  return normalized;
}
