/**
 * @file Normalizes values by replacing functions with a placeholder token.
 *
 * This enables consistent comparison between stored objects and reconstructed
 * objects from React Fiber, where function references may differ but represent
 * the same logical state.
 */

/**
 * The placeholder token used to represent functions in normalized values.
 * This constant ensures consistency across normalization and reconstruction.
 */
export const FUNCTION_PLACEHOLDER = "(fn)";

/**
 * Normalizes a value by replacing function properties with a placeholder.
 * Only normalizes one level deep - nested objects are kept as-is.
 *
 * @param value - The value to normalize (primitive, object, or function)
 * @returns The normalized value with functions replaced by placeholder tokens
 *
 * @example
 * ```typescript
 * // Primitive values pass through unchanged
 * normalizeValue("test") // → "test"
 * normalizeValue(42) // → 42
 * normalizeValue(null) // → null
 *
 * // Objects have their function properties normalized
 * normalizeValue({ value: "test", setValue: fn })
 * // → { value: "test", setValue: "(fn)" }
 *
 * // All functions object
 * normalizeValue({ onClick: fn, onSubmit: fn })
 * // → { onClick: "(fn)", onSubmit: "(fn)" }
 * ```
 */
export function normalizeValue(value: unknown): unknown {
  // Primitives and null pass through unchanged
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Arrays are not normalized (future enhancement)
  if (Array.isArray(value)) {
    return value;
  }

  // Normalize object properties
  const normalized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(value)) {
    normalized[key] = typeof val === "function" ? FUNCTION_PLACEHOLDER : val;
  }

  return normalized;
}
