/**
 * @file Adds a label with value for a component's hook.
 */

import { createLabelEntry } from "../createLabelEntry.js";
import { guidToLabelsMap } from "./LabelRegistryState.js";

/**
 * Adds a label with value for a component's hook.
 * This is used by the Babel plugin which knows the exact source position.
 *
 * **Normalization**: Uses Structural Comparison Normalization
 * - Functions → `"(fn)"` (literal string)
 * - Enables structural matching when function instances change
 *
 * For object-valued hooks:
 * - Normalizes function properties to "(fn)" placeholder
 * - Classifies properties and stores metadata for structural matching
 * - Enables matching custom hooks that return objects with changing values
 *
 * @param guid - The unique identifier for the component instance
 * @param entry - Label entry containing label, index, and value
 *
 * @see {@link createLabelEntry} for normalization details
 * @see {@link resolveHookLabel} which compares against these normalized values
 */
export function addLabelForGuid(
  guid: string,
  entry: { label: string; index: number; value: unknown }
): void {
  const processedEntry = createLabelEntry(
    entry.label,
    entry.index,
    entry.value
  );

  if (!guidToLabelsMap.has(guid)) {
    guidToLabelsMap.set(guid, []);
  }
  guidToLabelsMap.get(guid)!.push(processedEntry);
}
