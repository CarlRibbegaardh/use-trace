import type { StateChangeEntry } from "./buildStateChanges.js";
import type { PropChangeEntry } from "./buildPropChanges.js";

/**
 * Compute whether any state or prop change includes an identical value change warning.
 * Pure function; no side effects.
 */
export function computeIdenticalValueWarning(
  stateChanges: StateChangeEntry[],
  propChanges: PropChangeEntry[]
): boolean {
  return (
    stateChanges.some((c) => {return c.isIdenticalValueChange === true}) ||
    propChanges.some((c) => {return c.isIdenticalValueChange === true})
  );
}
