/**
 * @file Structural matching for normalized objects.
 *
 * Compares two normalized objects by their property keys (structure).
 * If keys match exactly in the same order, creates a new object
 * with values from the current object, preserving the structure.
 *
 * This is used in hook label resolution to detect when a custom hook
 * returns an object with the same structure but updated values.
 */

/**
 * Result of structural matching operation.
 */
export interface StructuralMatchResult {
  /**
   * True if structures match and values were updated successfully.
   */
  success: boolean;

  /**
   * The updated object with current values, or null on failure.
   */
  value: Record<string, unknown> | null;

  /**
   * Error type if matching failed.
   * - "structure-mismatch": Different keys or key order
   * - "invalid-input": Non-object input provided
   */
  error?: "structure-mismatch" | "invalid-input";
}

/**
 * Checks if a value is a plain object (not null, not array).
 *
 * @param value - The value to check.
 * @returns True if value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Compares two normalized objects by structure and updates values.
 *
 * Structure matching requires:
 * - Both inputs must be plain objects (not null, not array)
 * - Same number of properties
 * - Same property names in same order
 *
 * If structure matches, creates new object with:
 * - Property keys from stored object (preserving order)
 * - Property values from current object
 *
 * This is a shallow comparison - nested objects/arrays are treated
 * as single opaque values and copied by reference.
 *
 * @param stored - The stored normalized object from previous render.
 * @param current - The current normalized object from fiber reconstruction.
 * @returns Result with success status, updated value, or error code.
 *
 * @example
 * ```typescript
 * const stored = { value: "old", setValue: "(fn)" };
 * const current = { value: "new", setValue: "(fn)" };
 * const result = matchByStructure(stored, current);
 * // result.success === true
 * // result.value === { value: "new", setValue: "(fn)" }
 * ```
 *
 * @example
 * ```typescript
 * const stored = { value: "test" };
 * const current = { value: "test", extra: "key" };
 * const result = matchByStructure(stored, current);
 * // result.success === false
 * // result.error === "structure-mismatch"
 * ```
 */
export function matchByStructure(
  stored: Record<string, unknown>,
  current: Record<string, unknown>,
): StructuralMatchResult {
  // Validate inputs are plain objects
  if (!isPlainObject(stored) || !isPlainObject(current)) {
    return { success: false, value: null, error: "invalid-input" };
  }

  const storedKeys = Object.keys(stored);
  const currentKeys = Object.keys(current);

  // Check same number of keys
  if (storedKeys.length !== currentKeys.length) {
    return { success: false, value: null, error: "structure-mismatch" };
  }

  // Check same keys in same order (strict structural comparison)
  for (let i = 0; i < storedKeys.length; i++) {
    if (storedKeys[i] !== currentKeys[i]) {
      return { success: false, value: null, error: "structure-mismatch" };
    }
  }

  // Structure matches - create updated object with current values
  const updated: Record<string, unknown> = {};
  for (const key of storedKeys) {
    updated[key] = current[key];
  }

  return { success: true, value: updated };
}
