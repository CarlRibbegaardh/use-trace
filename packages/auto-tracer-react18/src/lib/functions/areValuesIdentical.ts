import { equals } from "ramda";
import { normalizeValue } from "./normalizeValue.js";

/**
 * Checks if two values are identical by deep comparison.
 *
 * Uses Ramda's equals for efficient deep equality comparison.
 * Normalizes values first so functions are compared structurally (treated as "(fn)").
 * Handles circular references, stops early on first difference.
 *
 * @param prevValue - The previous value
 * @param value - The current value
 * @returns true if values are deeply equal (after normalization), false otherwise
 */
export function areValuesIdentical(
  prevValue: unknown,
  value: unknown
): boolean {
  try {
    // Normalize both values for structural comparison (functions → "(fn)")
    const normalizedPrev = normalizeValue(prevValue);
    const normalizedCurrent = normalizeValue(value);
    return equals(normalizedPrev, normalizedCurrent);
  } catch {
    // Comparison failed - assume not identical
    return false;
  }
}
