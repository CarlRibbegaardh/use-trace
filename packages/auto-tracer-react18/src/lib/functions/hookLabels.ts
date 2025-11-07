/**
 * @file Registry for mapping component GUIDs to hook labels indexed by source position.
 */

// Registry mapping GUID -> labels indexed by hook position in source code
const guidToLabelsMap = new Map<string, Record<number, string>>();


/**
 * Adds a label for a specific hook at a given index position.
 * This is used by the Babel plugin which knows the exact source position.
 *
 * @param guid - The unique identifier for the component instance
 * @param label - The label name for the hook
 * @param index - The position of the hook in the source code (from _debugHookTypes)
 */
export function addLabelForGuid(guid: string, label: string, index: number): void {
  if (!guidToLabelsMap.has(guid)) {
    guidToLabelsMap.set(guid, {});
  }
  guidToLabelsMap.get(guid)![index] = label;
}

/**
 * Adds a label for a hook using auto-incrementing index.
 * This is used by the manual logger.labelState() API where the index is not known.
 *
 * @param guid - The unique identifier for the component instance
 * @param label - The label name for the hook
 */
// NOTE: Manual/auto-index mode removed. Index is required at callsite.

/**
 * Retrieves all labels for a component, indexed by hook position.
 *
 * @param guid - The unique identifier for the component instance
 * @returns A record mapping hook indices to their labels
 */
export function getLabelsForGuid(guid: string): Record<number, string> {
  return guidToLabelsMap.get(guid) || {};
}

/**
 * Clears all labels for a specific component.
 *
 * @param guid - The unique identifier for the component instance
 */
export function clearLabelsForGuid(guid: string): void {
  guidToLabelsMap.delete(guid);
}

/**
 * Clears all hook labels from the registry.
 */
export function clearAllHookLabels(): void {
  guidToLabelsMap.clear();
}
