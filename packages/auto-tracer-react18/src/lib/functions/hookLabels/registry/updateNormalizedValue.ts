/**
 * @file Updates the normalized value for a specific label entry.
 */

import { guidToLabelsMap } from "./LabelRegistryState.js";

/**
 * Updates the normalized value for a specific label entry.
 * This is a controlled mutation needed to track evolving object structures.
 *
 * @param guid - Component GUID
 * @param label - The label to update
 * @param newNormalizedValue - The new normalized value
 */
export function updateNormalizedValue(
  guid: string,
  label: string,
  newNormalizedValue: unknown
): void {
  const labels = guidToLabelsMap.get(guid);
  if (!labels) {
    return;
  }

  const entry = labels.find((l) => {
    return l.label === label;
  });
  if (entry) {
    // This is a controlled mutation for performance reasons
    // Alternative would be to recreate the entire labels array
    (entry as { normalizedValue: unknown }).normalizedValue =
      newNormalizedValue;
  }
}
