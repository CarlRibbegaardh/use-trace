/**
 * @file Registry for mapping component GUIDs to hook labels using value-based matching.
 */

import { stringify } from "./stringify.js";

/**
 * A label entry associates a hook's label with its build-time index and current value.
 * Used for value-based matching with ordinal disambiguation.
 */
export interface LabelEntry {
  /** Build-time ordinal position for ordering (source order) */
  index: number;
  /** Current state value for matching */
  value: unknown;
  /** Friendly name (e.g., "filteredTodos") */
  label: string;
}

// Registry mapping GUID -> array of label entries
const guidToLabelsMap = new Map<string, LabelEntry[]>();


/**
 * Adds a label with value for a component's hook.
 * This is used by the Babel plugin which knows the exact source position.
 *
 * @param guid - The unique identifier for the component instance
 * @param entry - Label entry containing label, index, and value
 */
export function addLabelForGuid(
  guid: string,
  entry: LabelEntry
): void {
  if (!guidToLabelsMap.has(guid)) {
    guidToLabelsMap.set(guid, []);
  }
  guidToLabelsMap.get(guid)!.push(entry);
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
 * Retrieves all label entries for a component.
 *
 * @param guid - The unique identifier for the component instance
 * @returns An array of label entries
 */
export function getLabelsForGuid(guid: string): LabelEntry[] {
  return guidToLabelsMap.get(guid) || [];
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

/**
 * Resolve hook label using value-based matching with ordinal disambiguation.
 *
 * @param guid - Component GUID
 * @param anchorIndex - Index of the anchor in the memoizedState chain
 * @param anchorValue - Current value of the hook state
 * @param allFiberAnchors - All stateful hooks in the fiber (labeled + unlabeled)
 * @returns A resolved label, a union of possible labels with 'unknown' (in source order), or 'unknown' if no match
 */
export function resolveHookLabel(
  guid: string,
  anchorIndex: number,
  anchorValue: unknown,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): string {
  const labels = getLabelsForGuid(guid);

  // Stringify values for proper object/array comparison
  const anchorValueStr = stringify(anchorValue);

  // Group fiber anchors by value
  const valueGroup = allFiberAnchors.filter(
    (a) => stringify(a.value) === anchorValueStr
  );

  // Scenario 1: Unique value in fiber → direct match
  if (valueGroup.length === 1) {
    const match = labels.find((l) => stringify(l.value) === anchorValueStr);
    return match?.label ?? "unknown";
  }

  // Scenarios 2 & 3: Duplicate values
  const labelsWithValue = labels.filter(
    (l) => stringify(l.value) === anchorValueStr
  );

  // Scenario 2: All occurrences labeled → ordinal match
  if (labelsWithValue.length === valueGroup.length) {
    const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
    const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);

    const ordinal = sortedAnchors.findIndex((a) => a.index === anchorIndex);
    return sortedLabels[ordinal]?.label ?? "unknown";
  }

  // Scenario 3: Partial coverage → use ordinal constraints
  const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);
  const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
  const currentAnchorOrdinal = sortedAnchors.findIndex(
    (a) => a.index === anchorIndex
  );

  const possibleLabels = sortedLabels.filter((label, labelOrdinal) => {
    const labelsBefore = labelOrdinal;
    const labelsAfter = sortedLabels.length - labelOrdinal - 1;

    return (
      currentAnchorOrdinal >= labelsBefore &&
      sortedAnchors.length - currentAnchorOrdinal - 1 >= labelsAfter
    );
  });

  // Return union of possible labels + unknown (in source order, not alphabetical)
  const labelNames = possibleLabels
    .sort((a, b) => a.index - b.index) // Preserve source order for developer clarity
    .map((l) => l.label);

  // If no labels match, return just "unknown" (not "unknown | unknown | ...")
  if (labelNames.length === 0) {
    return "unknown";
  }

  return [...labelNames, "unknown"].join(" | ");
}
