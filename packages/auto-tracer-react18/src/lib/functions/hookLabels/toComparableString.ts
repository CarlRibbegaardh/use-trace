/**
 * @file Pure function to create comparable strings for hook values.
 */

import { stringify } from "../stringify.js";
import { normalizeValue } from "../normalizeValue.js";

/**
 * Converts a value to a comparable string using Structural Comparison Normalization.
 * Functions are normalized to "(fn)" before stringification.
 *
 * @param value - The value to convert
 * @returns A stringified, normalized representation for comparison
 */
export function toComparableString(value: unknown): string {
  return stringify(normalizeValue(value));
}
