/**
 * @file Structural Comparison Normalization
 *
 * Normalizes values by replacing functions with a placeholder token for structural equivalence.
 *
 * This enables consistent comparison between stored objects and reconstructed
 * objects from React Fiber, where function references may differ but represent
 * the same logical state.
 *
 * **Normalization Type**: Structural Comparison Normalization
 * - Functions → `"(fn)"` (literal string, not function reference)
 * - Purpose: Enable structural matching when function instances change
 * - Trade-off: Loses function instance information (cannot distinguish f1 from f2)
 *
 * **Related**: For display/debugging, use Value Equality Normalization (`stringify` + `getFunctionId`)
 * which converts functions to `"(fn:N)"` to preserve instance distinctness.
 *
 * @see {@link stringify} for Value Equality Normalization with function instance tracking
 * @see STRUCTURAL_MATCHING_BUGS.md for detailed explanation of normalization types
 */

/**
 * The placeholder token used to represent functions in normalized values.
 * This constant ensures consistency across normalization and reconstruction.
 *
 * **Type**: Structural Comparison Normalization
 * - Value: `"(fn)"` (literal string)
 * - All functions become this same string
 * - Enables structural matching across renders
 */
export const FUNCTION_PLACEHOLDER = "(fn)";

/**
 * Normalizes a value for structural comparison by replacing function properties with a placeholder.
 * Only normalizes one level deep - nested objects are kept as-is.
 *
 * **Normalization Type**: Structural Comparison Normalization
 * - All function instances → `"(fn)"` (same literal string)
 * - Enables: `{value: "x", fn: f1}` ≡ `{value: "y", fn: f2}` (structure matches)
 * - Loses: Function instance information (f1 vs f2 indistinguishable)
 *
 * **Usage**:
 * - Registration phase: Store normalized values for later comparison
 * - Resolution phase: Normalize current values to compare against stored values
 *
 * **Warning**: Do NOT use this for display/debugging output! Use `stringify` instead,
 * which preserves function instance distinctness via `"(fn:N)"` format.
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
 * const fn1 = () => {};
 * const fn2 = () => {};
 * normalizeValue({ value: "test", setValue: fn1 })
 * // → { value: "test", setValue: "(fn)" }
 * normalizeValue({ value: "test", setValue: fn2 })
 * // → { value: "test", setValue: "(fn)" }
 * // Both return structurally equivalent objects (fn1 ≡ fn2)
 *
 * // All functions object
 * normalizeValue({ onClick: fn1, onSubmit: fn2 })
 * // → { onClick: "(fn)", onSubmit: "(fn)" }
 * ```
 *
 * @see {@link stringify} for Value Equality Normalization that preserves function distinctness
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
