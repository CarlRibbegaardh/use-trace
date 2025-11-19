/**
 * @file Clears all hook labels from the registry.
 */

import { guidToLabelsMap } from "./LabelRegistryState.js";

/**
 * Clears all hook labels from the registry.
 * Note: Previous labels are preserved to enable comparison in the next render.
 */
export function clearAllHookLabels(): void {
  guidToLabelsMap.clear();
  // Don't clear guidToPrevLabelsMap - we need it for the next render cycle
}
