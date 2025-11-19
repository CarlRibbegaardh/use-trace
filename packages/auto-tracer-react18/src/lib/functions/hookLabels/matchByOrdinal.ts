/**
 * @file Pure function to match hooks by ordinal position when all occurrences are labeled.
 */

import { stringify } from "../stringify.js";
import { toComparableString } from "./toComparableString.js";
import type { LabelEntry } from "./LabelEntry.js";
import type { FiberAnchor } from "./FiberAnchor.js";

/**
 * Matches a hook by ordinal position when all occurrences of a duplicate value are labeled.
 * Uses sorted indexes to determine position-based mapping.
 *
 * @param labelsWithValue - Label entries that match the anchor's comparable value
 * @param valueGroup - All fiber anchors that share the same comparable value
 * @param anchorIndex - The index of the current hook to resolve
 * @returns The matching label entry, or null if ordinal matching fails
 */
export function matchByOrdinal(
  labelsWithValue: readonly LabelEntry[],
  valueGroup: readonly FiberAnchor[],
  anchorIndex: number
): LabelEntry | null {
  // Only use ordinal matching if all occurrences are labeled
  if (labelsWithValue.length !== valueGroup.length) {
    return null;
  }

  const sortedAnchors = [...valueGroup].sort((a, b) => {
    return a.index - b.index;
  });
  const sortedLabels = [...labelsWithValue].sort((a, b) => {
    return a.index - b.index;
  });

  const ordinal = sortedAnchors.findIndex((a) => {
    return a.index === anchorIndex;
  });

  return sortedLabels[ordinal] ?? null;
}
