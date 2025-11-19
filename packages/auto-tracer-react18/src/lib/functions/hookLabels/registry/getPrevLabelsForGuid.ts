/**
 * @file Retrieves previous render's label entries for a component.
 */

import type { LabelEntry } from "../LabelEntry.js";
import { guidToPrevLabelsMap } from "./LabelRegistryState.js";

/**
 * Retrieves previous render's label entries for a component.
 *
 * @param guid - The unique identifier for the component instance
 * @returns An array of label entries from previous render
 */
export function getPrevLabelsForGuid(guid: string): LabelEntry[] {
  return guidToPrevLabelsMap.get(guid) || [];
}
