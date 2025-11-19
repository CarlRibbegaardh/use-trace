/**
 * @file Clears all labels for a specific component.
 */

import { guidToLabelsMap } from "./LabelRegistryState.js";

/**
 * Clears all labels for a specific component.
 *
 * @param guid - The unique identifier for the component instance
 */
export function clearLabelsForGuid(guid: string): void {
  guidToLabelsMap.delete(guid);
}
