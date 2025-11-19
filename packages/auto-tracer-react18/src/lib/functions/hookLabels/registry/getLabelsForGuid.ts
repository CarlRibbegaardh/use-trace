/**
 * @file Retrieves all label entries for a component.
 */

import type { LabelEntry } from "../LabelEntry.js";
import { guidToLabelsMap } from "./LabelRegistryState.js";

/**
 * Retrieves all label entries for a component.
 *
 * @param guid - The unique identifier for the component instance
 * @returns An array of label entries
 */
export function getLabelsForGuid(guid: string): LabelEntry[] {
  return guidToLabelsMap.get(guid) || [];
}
