/**
 * @file Pure function to create comparable strings for hook values.
 */

import { normalizeValue } from "../normalizeValue.js";
import { stringify } from "../stringify.js";

/**
 * Converts a value to a comparable string using Structural Comparison Normalization.
 *
 * Uses stringify(normalizeValue()) which normalizes functions to "(fn)" before
 * stringifying.
 *
 * @param value - The value to convert
 * @returns A stringified, normalized representation for comparison
 */
export function toComparableString(value: unknown): string {
  return stringify(normalizeValue(value));
}
