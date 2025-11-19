/**
 * @file Pure function to match hooks by ordinal constraints when partially labeled.
 */

import type { LabelEntry } from "./LabelEntry.js";
import type { FiberAnchor } from "./FiberAnchor.js";

/**
 * Filters labels to those that could match based on ordinal position constraints.
 * Used when duplicate values are only partially labeled.
 *
 * @param labelsWithValue - Label entries that match the anchor's comparable value
 * @param valueGroup - All fiber anchors that share the same comparable value
 * @param anchorIndex - The index of the current hook to resolve
 * @returns Array of possible matching label entries (may be empty)
 */
export function matchByConstraints(
  labelsWithValue: readonly LabelEntry[],
  valueGroup: readonly FiberAnchor[],
  anchorIndex: number
): readonly LabelEntry[] {
  const sortedLabels = [...labelsWithValue].sort((a, b) => {
    return a.index - b.index;
  });
  const sortedAnchors = [...valueGroup].sort((a, b) => {
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

  return possibleLabels;
}
