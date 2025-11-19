/**
 * @file Saves current labels as "previous" for comparison in next render.
 */

import { guidToLabelsMap, guidToPrevLabelsMap } from "./LabelRegistryState.js";

/**
 * Saves current labels as "previous" for comparison in next render.
 * This should be called during commit phase when labels are complete.
 *
 * @param guid - The unique identifier for the component instance
 */
export function savePrevLabelsForGuid(guid: string): void {
  const currentLabels = guidToLabelsMap.get(guid);
  if (currentLabels) {
    guidToPrevLabelsMap.set(guid, currentLabels);
  }
}
