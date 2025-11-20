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
import { traceOptions } from "../../../types/globalState.js";

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
  const shouldLogDetail =
    traceOptions.enableAutoTracerInternalsLogging ?? false;

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: ENTER - guid=${guid}, anchorIndex=${anchorIndex}, anchorValue type=${typeof anchorValue}, allFiberAnchors.length=${
        allFiberAnchors.length
      }`
    );
  }

  const labels = getLabelsForGuid(guid);

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: Got ${labels.length} labels for GUID`
    );
    console.log(
      `[AutoTracer] resolveHookLabel: Checking anchorValue - type=${typeof anchorValue}, isNull=${
        anchorValue === null
      }`
    );
  }

  // Guard: Detect React internal objects (elements, fibers) that would cause infinite recursion
  if (anchorValue !== null && typeof anchorValue === "object") {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: anchorValue is object, checking for React internals...`
      );
    }

    // Check for React symbols and fiber properties
    if (
      "$$typeof" in anchorValue ||
      "stateNode" in anchorValue ||
      "containerInfo" in anchorValue ||
      "tag" in anchorValue
    ) {
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] resolveHookLabel: anchorValue is a React internal object (direct properties), returning "unknown"`
        );
      }
      return "unknown";
    }

    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: No direct React properties found, attempting safe stringify with depth limit...`
      );
    }

    // Try to stringify with a depth limit to prevent deep recursion
    // If it fails or takes too long, return "unknown"
    try {
      // Use JSON.stringify with a simple depth limiter as a quick check
      let depth = 0;
      JSON.stringify(anchorValue, (_key, value) => {
        depth++;
        if (depth > 100) {
          throw new Error("Max depth exceeded");
        }
        return value;
      });

      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] resolveHookLabel: JSON.stringify succeeded (depth=${depth}), safe to proceed`
        );
      }
    } catch (error) {
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] resolveHookLabel: JSON.stringify failed or too deep - ${error}, returning "unknown"`
        );
      }
      return "unknown";
    }
  }

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: About to call toComparableString NOW`
    );
  }

  let anchorComparable: string;
  try {
    anchorComparable = toComparableString(anchorValue);
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: toComparableString succeeded, result length=${anchorComparable.length}`
      );
    }
  } catch (error) {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: toComparableString FAILED - ${error}. Returning "unknown"`
      );
    }
    return "unknown";
  }

  // Group fiber anchors by comparable value
  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: Filtering allFiberAnchors to find matching values...`
    );
  }

  const valueGroup = allFiberAnchors.filter((a) => {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: Comparing anchor index=${a.index}, calling toComparableString...`
      );
    }

    // Guard: Check for circular structures before calling toComparableString
    if (a.value !== null && typeof a.value === "object") {
      try {
        let depth = 0;
        JSON.stringify(a.value, (_key, value) => {
          depth++;
          if (depth > 100) {
            throw new Error("Max depth exceeded");
          }
          return value;
        });
      } catch (error) {
        if (shouldLogDetail) {
          console.log(
            `[AutoTracer] resolveHookLabel: Anchor ${a.index} has circular/deep structure - ${error}, skipping`
          );
        }
        return false;
      }
    }

    try {
      const comparable = toComparableString(a.value);
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] resolveHookLabel: Anchor ${
            a.index
          } comparable="${comparable.substring(0, 50)}${
            comparable.length > 50 ? "..." : ""
          }"`
        );
      }
      return comparable === anchorComparable;
    } catch (error) {
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] resolveHookLabel: toComparableString failed for anchor ${a.index} - ${error}, skipping`
        );
      }
      return false;
    }
  });

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: Found ${valueGroup.length} matching anchors`
    );
  }

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
