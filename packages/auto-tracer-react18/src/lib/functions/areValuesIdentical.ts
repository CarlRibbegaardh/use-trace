import { equals } from "ramda";

/**
 * Checks if two values are identical by deep comparison.
 *
 * Uses Ramda's equals for efficient deep equality comparison.
 * Handles circular references, stops early on first difference.
 *
 * @param prevValue - The previous value
 * @param value - The current value
 * @returns true if values are deeply equal, false otherwise
 */
export function areValuesIdentical(
  prevValue: unknown,
  value: unknown
): boolean {
  try {
    return equals(prevValue, value);
  } catch {
    // Comparison failed - assume not identical
    return false;
  }
}
