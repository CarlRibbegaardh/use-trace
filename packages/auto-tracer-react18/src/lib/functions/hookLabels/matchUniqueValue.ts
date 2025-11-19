/**
 * @file Pure function to match a hook by unique value.
 */

import { stringify } from "../stringify.js";
import { toComparableString } from "./toComparableString.js";
import { checkKeyOrderMatches } from "./checkKeyOrderMatches.js";
import type { LabelEntry } from "./LabelEntry.js";

/**
 * Attempts to match a hook with a unique value to a registered label.
 * Performs value equality check with key order verification.
 *
 * @param labels - All registered label entries for the component
 * @param anchorValue - Current value of the hook to match
 * @returns The matching label entry, or null if no match found
 */
export function matchUniqueValue(
  labels: readonly LabelEntry[],
  anchorValue: unknown
): LabelEntry | null {
  const anchorComparable = toComparableString(anchorValue);

  const match = labels.find((l) => {
    // First check if comparable strings match (value equality)
    // Use stringify for registered value to preserve function IDs
    const labelComparable = stringify(l.normalizedValue);
    if (labelComparable !== anchorComparable) {
      return false;
    }

    // Verify key order matches for objects (fix for Bug 2)
    return checkKeyOrderMatches(l.normalizedValue, anchorValue);
  });

  return match ?? null;
}
