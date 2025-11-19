/**
 * @file Registry for mapping component GUIDs to hook labels using value-based matching.
 */

import { stringify } from "./stringify.js";
import { createLabelEntry } from "./hookLabels/createLabelEntry.js";
import { toComparableString } from "./hookLabels/toComparableString.js";
import { matchUniqueValue } from "./hookLabels/matchUniqueValue.js";
import { matchByOrdinal } from "./hookLabels/matchByOrdinal.js";
import { matchByConstraints } from "./hookLabels/matchByConstraints.js";
import { tryStructuralMatch } from "./hookLabels/tryStructuralMatch.js";

// Re-export types for backward compatibility
export type { LabelEntry } from "./hookLabels/LabelEntry.js";
export type { FiberAnchor } from "./hookLabels/FiberAnchor.js";

import type { LabelEntry } from "./hookLabels/LabelEntry.js";

// Registry mapping GUID -> array of label entries
const guidToLabelsMap = new Map<string, LabelEntry[]>();

// Registry for storing previous render's labels (before they get cleared)
const guidToPrevLabelsMap = new Map<string, LabelEntry[]>();

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
 * Retrieves previous render's label entries for a component.
 *
 * @param guid - The unique identifier for the component instance
 * @returns An array of label entries from previous render
 */
export function getPrevLabelsForGuid(guid: string): LabelEntry[] {
  return guidToPrevLabelsMap.get(guid) || [];
}

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
 * Note: Previous labels are preserved to enable comparison in the next render.
 */
export function clearAllHookLabels(): void {
  guidToLabelsMap.clear();
  // Don't clear guidToPrevLabelsMap - we need it for the next render cycle
}

/**
 * Resolve hook label using value-based matching with ordinal disambiguation.
 *
 * **Normalization**: Uses Structural Comparison Normalization for matching
 * - Current value → structurally normalized → compared to stored normalized values
 * - Functions → `"(fn)"` for comparison
 * - Enables structural matching when function instances change
 *
 * Matching strategy:
 * 1. Primitive value matching (existing logic for strings, numbers, booleans, etc.)
 * 2. Structural matching fallback for objects
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
  const anchorComparable = toComparableString(anchorValue);

  // Group fiber anchors by comparable value
  const valueGroup = allFiberAnchors.filter((a) => {
    return toComparableString(a.value) === anchorComparable;
  });

  // Scenario 1: Unique value in fiber → direct match
  if (valueGroup.length === 1) {
    const match = matchUniqueValue(labels, anchorValue);

    if (match?.label) {
      return match.label;
    }

    // Try structural matching before giving up (unique-value branch)
    const structuralResult = tryStructuralMatch(
      labels,
      anchorIndex,
      anchorValue,
      allFiberAnchors
    );

    if (structuralResult.success && structuralResult.label) {
      // Update the label entry if needed
      if (structuralResult.updatedNormalizedValue !== null) {
        updateNormalizedValue(
          guid,
          structuralResult.label,
          structuralResult.updatedNormalizedValue
        );
      }
      return structuralResult.label;
    }
    return "unknown";
  }

  // Scenarios 2 & 3: Duplicate values
  const labelsWithValue = labels.filter((l) => {
    const labelComparable = stringify(l.normalizedValue);
    return labelComparable === anchorComparable;
  });

  // Scenario 2: All occurrences labeled → ordinal match
  const ordinalMatch = matchByOrdinal(labelsWithValue, valueGroup, anchorIndex);
  if (ordinalMatch) {
    return ordinalMatch.label;
  }

  // Scenario 3: Partial coverage → use ordinal constraints
  const possibleLabels = matchByConstraints(
    labelsWithValue,
    valueGroup,
    anchorIndex
  );

  // If no labels match, try structural matching before giving up
  if (possibleLabels.length === 0) {
    const structuralResult = tryStructuralMatch(
      labels,
      anchorIndex,
      anchorValue,
      allFiberAnchors
    );

    if (structuralResult.success && structuralResult.label) {
      // Update the label entry if needed
      if (structuralResult.updatedNormalizedValue !== null) {
        updateNormalizedValue(
          guid,
          structuralResult.label,
          structuralResult.updatedNormalizedValue
        );
      }
      return structuralResult.label;
    }
    return "unknown";
  }

  // Return union of possible labels + unknown (in source order)
  const labelNames = [...possibleLabels]
    .sort((a, b) => {
      return a.index - b.index;
    })
    .map((l) => {
      return l.label;
    });

  return [...labelNames, "unknown"].join(" | ");
}

/**
 * Updates the normalized value for a specific label entry.
 * This is a controlled mutation needed to track evolving object structures.
 *
 * @param guid - Component GUID
 * @param label - The label to update
 * @param newNormalizedValue - The new normalized value
 */
function updateNormalizedValue(
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
