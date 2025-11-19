/**
 * @file Resolves hook label using value-based matching with ordinal disambiguation.
 */

import { stringify } from "../../stringify.js";
import { toComparableString } from "../toComparableString.js";
import { matchUniqueValue } from "../matchUniqueValue.js";
import { matchByOrdinal } from "../matchByOrdinal.js";
import { matchByConstraints } from "../matchByConstraints.js";
import { tryStructuralMatch } from "../tryStructuralMatch.js";
import { getLabelsForGuid } from "./getLabelsForGuid.js";
import { updateNormalizedValue } from "./updateNormalizedValue.js";

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

  //  Scenarios 2 & 3: Duplicate values
  const labelsWithValue = labels.filter((l) => {
    // Use stringify consistently with function IDs
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
