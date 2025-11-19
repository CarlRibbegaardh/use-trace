/**
 * @file Pure function for structural matching of object-valued hooks.
 */

import { normalizeValue } from "../normalizeValue.js";
import { stringify } from "../stringify.js";
import { type FiberHook, reconstructObjectFromFiber } from "../reconstructObjectFromFiber.js";
import { matchByStructure } from "../matchByStructure.js";
import type { LabelEntry } from "./LabelEntry.js";
import type { FiberAnchor } from "./FiberAnchor.js";

/**
 * Result of structural matching attempt.
 */
export interface StructuralMatchResult {
  /** Whether a match was found */
  readonly success: boolean;
  /** The matched label (if success=true) */
  readonly label: string | null;
  /** Updated normalized value (if match found and needs updating) */
  readonly updatedNormalizedValue: unknown | null;
}

/**
 * Attempts to match a hook by object structure.
 * This is a pure function that returns new values instead of mutating.
 *
 * For custom hooks returning objects with changing values:
 * 1. Normalize the current anchor value
 * 2. For each labeled entry with metadata at the matching index:
 *    - Reconstruct object from fiber hooks using stored metadata
 *    - Match by structure (same property keys)
 *    - If match found, return label and updated normalized value
 *
 * @param labels - All labeled entries for this component
 * @param anchorIndex - Current hook index in fiber
 * @param anchorValue - Current hook value
 * @param allFiberAnchors - All hooks in the fiber
 * @returns Result indicating success, label, and updated normalized value
 */
export function tryStructuralMatch(
  labels: readonly LabelEntry[],
  anchorIndex: number,
  anchorValue: unknown,
  allFiberAnchors: readonly FiberAnchor[]
): StructuralMatchResult {
  // Normalize current anchor value (may be primitive)
  const normalizedCurrent = normalizeValue(anchorValue);

  // Try to match against each labeled entry that has metadata AND matches the anchor index
  for (const labelEntry of labels) {
    // CRITICAL: Only match labels at the same index position
    // This prevents structural matching from returning the wrong label when
    // multiple hooks have identical structure (Bug 3 & 4)
    if (labelEntry.index !== anchorIndex) {
      continue;
    }

    if (!labelEntry.propertyMetadata) {
      continue; // Skip non-object labels
    }

    // SPECIAL CASE: Fiber value is primitive, but label is an object (custom hook wrapper scenario)
    // Check if the primitive matches any property value in the registered object
    if (
      (typeof normalizedCurrent !== "object" || normalizedCurrent === null) &&
      typeof labelEntry.normalizedValue === "object" &&
      labelEntry.normalizedValue !== null
    ) {
      const labelObject = labelEntry.normalizedValue as Record<string, unknown>;
      const normalizedCurrentStr = stringify(normalizedCurrent);

      // Check if the primitive matches any property value in the registered object
      const matchingProperty = Object.entries(labelObject).find(
        ([_key, propValue]) => {
          return stringify(normalizeValue(propValue)) === normalizedCurrentStr;
        }
      );

      if (matchingProperty) {
        // Return success without updating normalized value (keep the object for future wrapper matches)
        return {
          success: true,
          label: labelEntry.label,
          updatedNormalizedValue: null,
        };
      }

      // No property matched - skip to next label (don't try reconstruction for primitive-vs-object mismatch)
      continue;
    }

    // Fast-path: if current value is an object, compare normalized keys directly
    if (
      typeof normalizedCurrent === "object" &&
      normalizedCurrent !== null &&
      typeof labelEntry.normalizedValue === "object" &&
      labelEntry.normalizedValue !== null
    ) {
      const storedKeys = Object.keys(
        labelEntry.normalizedValue as Record<string, unknown>
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
        // Return updated normalized value for future comparisons
        return {
          success: true,
          label: labelEntry.label,
          updatedNormalizedValue: normalizedCurrent,
        };
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

    // CRITICAL FIX FOR BUG 1 & 2: Verify reconstructed structure matches CURRENT structure
    // The reconstruction only includes properties from stored metadata (old structure).
    // If the current value has more/fewer keys or different key order, reject the match.
    if (
      typeof normalizedReconstructed === "object" &&
      normalizedReconstructed !== null &&
      typeof normalizedCurrent === "object" &&
      normalizedCurrent !== null
    ) {
      const reconstructedKeys = Object.keys(
        normalizedReconstructed as Record<string, unknown>
      );
      const currentKeys = Object.keys(
        normalizedCurrent as Record<string, unknown>
      );

      // Check if structures match (same keys in same order)
      if (
        reconstructedKeys.length !== currentKeys.length ||
        !reconstructedKeys.every((k, i) => {
          return k === currentKeys[i];
        })
      ) {
        // Structure mismatch - current value has evolved (Bug 1: different keys, Bug 2: different order)
        continue; // Skip this label, try next one
      }
    }

    // Match by structure (this should now always succeed given the check above)
    const matchResult = matchByStructure(
      labelEntry.normalizedValue as Record<string, unknown>,
      normalizedReconstructed as Record<string, unknown>
    );

    if (matchResult.success) {
      // Structure matches! Return updated normalized value for future matches
      return {
        success: true,
        label: labelEntry.label,
        updatedNormalizedValue: normalizedReconstructed,
      };
    }
  }

  return {
    success: false,
    label: null,
    updatedNormalizedValue: null,
  };
}
