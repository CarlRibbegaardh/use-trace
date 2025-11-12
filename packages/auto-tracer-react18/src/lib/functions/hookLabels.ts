/**
 * @file Registry for mapping component GUIDs to hook labels using value-based matching.
 */

import { stringify } from "./stringify.js";
import { normalizeValue } from "./normalizeValue.js";
import {
  type PropertyMetadata,
  classifyObjectProperties,
} from "./classifyObjectProperties.js";
import {
  type FiberHook,
  reconstructObjectFromFiber,
} from "./reconstructObjectFromFiber.js";
import { matchByStructure } from "./matchByStructure.js";

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
  /** Property metadata for object-valued hooks (optional, for structural matching) */
  propertyMetadata?: PropertyMetadata;
}

// Registry mapping GUID -> array of label entries
const guidToLabelsMap = new Map<string, LabelEntry[]>();

// Registry for storing previous render's labels (before they get cleared)
const guidToPrevLabelsMap = new Map<string, LabelEntry[]>();

/**
 * Adds a label with value for a component's hook.
 * This is used by the Babel plugin which knows the exact source position.
 *
 * For object-valued hooks:
 * - Normalizes function properties to "(fn)" placeholder
 * - Classifies properties and stores metadata for structural matching
 * - Enables matching custom hooks that return objects with changing values
 *
 * @param guid - The unique identifier for the component instance
 * @param entry - Label entry containing label, index, and value
 */
export function addLabelForGuid(guid: string, entry: LabelEntry): void {
  // Compute metadata from the ORIGINAL value (so functions are still detectable)
  const metadataOriginal = classifyObjectProperties(entry.value);
  // Normalize value AFTER metadata extraction (functions replaced with placeholder for matching)
  const normalizedValue = normalizeValue(entry.value);

  const processedEntry: LabelEntry = {
    ...entry,
    value: normalizedValue,
    propertyMetadata: metadataOriginal ?? undefined,
  };

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
 * Matching strategy:
 * 1. Primitive value matching (existing logic for strings, numbers, booleans, etc.)
 * 2. Structural matching fallback for objects (Solution 8):
 *    - Normalize current anchor value
 *    - Try to match by object structure (same property keys)
 *    - If structure matches, update values and return label
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

  // Build comparable string using normalization (functions -> "(fn)")
  const toComparableString = (v: unknown) => {
    return stringify(normalizeValue(v));
  };
  const anchorComparable = toComparableString(anchorValue);

  // Group fiber anchors by comparable value
  const valueGroup = allFiberAnchors.filter((a) => {
    return toComparableString(a.value) === anchorComparable;
  });

  // Scenario 1: Unique value in fiber → direct match
  if (valueGroup.length === 1) {
    const match = labels.find((l) => {
      return toComparableString(l.value) === anchorComparable;
    });
    if (match?.label) {
      return match.label;
    }

    // Try structural matching before giving up (unique-value branch)
    const structuralMatch = tryStructuralMatching(
      labels,
      anchorIndex,
      anchorValue,
      allFiberAnchors
    );
    if (structuralMatch) {
      return structuralMatch;
    }
    return "unknown";
  }

  // Scenarios 2 & 3: Duplicate values
  const labelsWithValue = labels.filter((l) => {
    return toComparableString(l.value) === anchorComparable;
  });

  // Scenario 2: All occurrences labeled → ordinal match
  if (labelsWithValue.length === valueGroup.length) {
    const sortedAnchors = valueGroup.sort((a, b) => {
      return a.index - b.index;
    });
    const sortedLabels = labelsWithValue.sort((a, b) => {
      return a.index - b.index;
    });

    const ordinal = sortedAnchors.findIndex((a) => {
      return a.index === anchorIndex;
    });
    return sortedLabels[ordinal]?.label ?? "unknown";
  }

  // Scenario 3: Partial coverage → use ordinal constraints
  const sortedLabels = labelsWithValue.sort((a, b) => {
    return a.index - b.index;
  });
  const sortedAnchors = valueGroup.sort((a, b) => {
    return a.index - b.index;
  });
  const currentAnchorOrdinal = sortedAnchors.findIndex((a) => {
    return a.index === anchorIndex;
  });

  const possibleLabels = sortedLabels.filter((_label, labelOrdinal) => {
    const labelsBefore = labelOrdinal;
    const labelsAfter = sortedLabels.length - labelOrdinal - 1;

    return (
      currentAnchorOrdinal >= labelsBefore &&
      sortedAnchors.length - currentAnchorOrdinal - 1 >= labelsAfter
    );
  });

  // Return union of possible labels + unknown (in source order, not alphabetical)
  const labelNames = possibleLabels
    .sort((a, b) => {
      return a.index - b.index;
    }) // Preserve source order for developer clarity
    .map((l) => {
      return l.label;
    });

  // If no labels match, try structural matching before giving up
  if (labelNames.length === 0) {
    const structuralMatch = tryStructuralMatching(
      labels,
      anchorIndex,
      anchorValue,
      allFiberAnchors
    );
    if (structuralMatch) {
      return structuralMatch;
    }
    return "unknown";
  }

  return [...labelNames, "unknown"].join(" | ");
}

/**
 * Attempts to match a hook by object structure (Solution 8).
 *
 * For custom hooks returning objects with changing values:
 * 1. Normalize the current anchor value
 * 2. For each labeled entry with metadata:
 *    - Reconstruct object from fiber hooks using stored metadata
 *    - Match by structure (same property keys)
 *    - If match found, update label entry value and return label
 *
 * @param labels - All labeled entries for this component
 * @param anchorIndex - Current hook index in fiber
 * @param anchorValue - Current hook value
 * @param allFiberAnchors - All hooks in the fiber
 * @returns Label if structural match found, null otherwise
 */
function tryStructuralMatching(
  labels: LabelEntry[],
  anchorIndex: number,
  anchorValue: unknown,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): string | null {
  // Normalize current anchor value (may be primitive)
  const normalizedCurrent = normalizeValue(anchorValue);

  // Try to match against each labeled entry that has metadata
  for (const labelEntry of labels) {
    if (!labelEntry.propertyMetadata) {
      continue; // Skip non-object labels
    }

    // SPECIAL CASE: Fiber value is primitive, but label is an object (custom hook wrapper scenario)
    // Check if the primitive matches any property value in the registered object
    if (
      (typeof normalizedCurrent !== "object" || normalizedCurrent === null) &&
      typeof labelEntry.value === "object" &&
      labelEntry.value !== null
    ) {
      const labelObject = labelEntry.value as Record<string, unknown>;
      const normalizedCurrentStr = stringify(normalizedCurrent);

      // Check if the primitive matches any property value in the registered object
      const matchingProperty = Object.entries(labelObject).find(
        ([_key, propValue]) => {
          return stringify(normalizeValue(propValue)) === normalizedCurrentStr;
        }
      );

      if (matchingProperty) {
        // Don't update labelEntry.value here - keep the object for future wrapper matches
        return labelEntry.label;
      }

      // No property matched - skip to next label (don't try reconstruction for primitive-vs-object mismatch)
      continue;
    }

    // Fast-path: if current value is an object, compare normalized keys directly
    if (
      typeof normalizedCurrent === "object" &&
      normalizedCurrent !== null &&
      typeof labelEntry.value === "object" &&
      labelEntry.value !== null
    ) {
      const storedKeys = Object.keys(
        labelEntry.value as Record<string, unknown>
      );
      const currentKeys = Object.keys(
        normalizedCurrent as Record<string, unknown>
      );
      if (
        storedKeys.length === currentKeys.length &&
        storedKeys.every((k, i) => {
          return k === currentKeys[i];
        })
      ) {
        // Keys match exactly in order → structural match
        labelEntry.value = normalizedCurrent; // update to latest normalized value
        return labelEntry.label;
      }
    }

    // Reconstruct the object from fiber hooks using stored metadata
    const fiberHooks: FiberHook[] = allFiberAnchors.map((a) => {
      return {
        index: a.index,
        value: a.value,
      };
    });

    const reconstructionResult = reconstructObjectFromFiber(
      anchorIndex,
      labelEntry.propertyMetadata,
      fiberHooks
    );

    if (!reconstructionResult.success) {
      continue; // Reconstruction failed, try next label
    }

    // Normalize the reconstructed object
    const normalizedReconstructed = normalizeValue(reconstructionResult.value);

    // Match by structure
    const matchResult = matchByStructure(
      labelEntry.value as Record<string, unknown>,
      normalizedReconstructed as Record<string, unknown>
    );

    if (matchResult.success) {
      // Structure matches! Update the label entry value for future matches
      labelEntry.value = normalizedReconstructed;
      return labelEntry.label;
    }
  }

  return null; // No structural match found
}
