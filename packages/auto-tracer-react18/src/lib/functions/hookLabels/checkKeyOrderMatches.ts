/**
 * @file Pure function to check if normalized object keys match in order.
 */

import { normalizeValue } from "../normalizeValue.js";

/**
 * Checks if two values have matching object key order after normalization.
 * Returns true for non-objects or if key order matches exactly.
 *
 * @param storedValue - The previously stored normalized value
 * @param currentValue - The current value to check
 * @returns True if keys match in order (or both are non-objects)
 */
export function checkKeyOrderMatches(
  storedValue: unknown,
  currentValue: unknown
): boolean {
  // Only check objects (not arrays or null)
  if (
    typeof storedValue !== "object" ||
    storedValue === null ||
    typeof currentValue !== "object" ||
    currentValue === null ||
    Array.isArray(storedValue) ||
    Array.isArray(currentValue)
  ) {
    return true; // Non-objects always match
  }

  const storedKeys = Object.keys(storedValue as Record<string, unknown>);
  const currentNormalized = normalizeValue(currentValue);
  const currentKeys = Object.keys(currentNormalized as Record<string, unknown>);

  // Check if key order matches
  return (
    storedKeys.length === currentKeys.length &&
    storedKeys.every((k, i) => {
      return k === currentKeys[i];
    })
  );
}
