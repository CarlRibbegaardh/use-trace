import type { Hook } from "../../../hookMapping/types.js";
import { isReactInternal } from "../../../isReactInternal.js";
import { AUTOTRACER_STATE_MARKER } from "../../../../types/marker.js";
import { areValuesIdentical } from "../../../areValuesIdentical.js";
import { traceOptions } from "../../../../types/globalState.js";
import { resolveHookLabel } from "../../../hookLabels.js";
import {
  getLabelsForGuid,
  getPrevLabelsForGuid,
  savePrevLabelsForGuid,
} from "../../../hookLabels.js";
import type { AnchorEntry } from "./getHookAnchors.js";

export interface StateChangeEntry {
  name: string;
  value: unknown;
  prevValue: unknown;
  hook: {
    memoizedState: unknown;
    queue: unknown;
    next: unknown;
  };
  isIdenticalValueChange: boolean;
}

export interface UseStateValueEntry {
  name: string;
  value: unknown;
  prevValue?: unknown;
  hook: {
    memoizedState: unknown;
    queue: unknown;
    next: unknown;
  };
}

/**
 * Build the list of state changes for a fiber, handling both mount and update cases.
 * Includes unmatched labeled values and identical value detection. Persists the
 * previous label snapshot after computing updates. Contains a deliberate side effect
 * (savePrevLabelsForGuid) on updates to maintain snapshot timing.
 *
 * @param isNewMount - Whether this is the first mount of the component
 * @param useStateValues - Extracted useState entries from the fiber
 * @param anchors - Ordered list of stateful hook anchors
 * @param allAnchors - Anchor index/value pairs for label resolution
 * @param trackingGUID - Tracking GUID if component is tracked, otherwise null
 * @returns Array of state change entries
 */
export function buildStateChanges(
  isNewMount: boolean,
  useStateValues: UseStateValueEntry[],
  anchors: readonly Hook[],
  allAnchors: AnchorEntry[],
  trackingGUID: string | null
): StateChangeEntry[] {
  if (isNewMount) {
    const fiberStateChanges = useStateValues
      .filter(({ name, value }) => {
        return !isReactInternal(name) && value !== AUTOTRACER_STATE_MARKER;
      })
      .map(({ value, hook }) => {
        const anchorIndex = anchors.indexOf(hook as unknown as Hook);
        const resolvedName = resolveHookLabel(
          trackingGUID ?? "",
          anchorIndex,
          (hook as Hook).memoizedState,
          allAnchors
        );
        return {
          name: resolvedName,
          value,
          prevValue: undefined as unknown,
          hook,
          isIdenticalValueChange: false,
        } as StateChangeEntry;
      });

    const matchedLabels = new Set(fiberStateChanges.map((c) => {return c.name}));

    const unmatchedLabelChanges = trackingGUID
      ? getLabelsForGuid(trackingGUID)
          .filter(({ label }) => {return !matchedLabels.has(label)})
          .map(({ label, value }) => {
            return {
              name: label,
              value,
              prevValue: undefined as unknown,
              hook: null as unknown as Hook,
              isIdenticalValueChange: false,
            } as StateChangeEntry;
          })
      : [];

    return [...fiberStateChanges, ...unmatchedLabelChanges];
  }

  const fiberStateChanges = useStateValues
    .filter(({ name, value, prevValue }) => {
      return (
        prevValue !== undefined &&
        prevValue !== value &&
        !isReactInternal(name) &&
        value !== AUTOTRACER_STATE_MARKER &&
        prevValue !== AUTOTRACER_STATE_MARKER
      );
    })
    .map(({ value, prevValue, hook }) => {
      const isIdenticalValueChange =
        !!traceOptions.detectIdenticalValueChanges &&
        prevValue !== value &&
        areValuesIdentical(prevValue, value);

      const anchorIndex = anchors.indexOf(hook as unknown as Hook);
      const resolvedName = resolveHookLabel(
        trackingGUID ?? "",
        anchorIndex,
        (hook as Hook).memoizedState,
        allAnchors
      );

      return {
        name: resolvedName,
        value,
        prevValue,
        hook,
        isIdenticalValueChange,
      } as StateChangeEntry;
    });

  const matchedLabels = new Set(fiberStateChanges.map((c) => {return c.name}));

  const unmatchedLabelChanges = (() => {
    if (!trackingGUID) return [] as StateChangeEntry[];

    const currentLabels = getLabelsForGuid(trackingGUID);
    const prevLabels = getPrevLabelsForGuid(trackingGUID);

    const prevValueMap = new Map(prevLabels.map((e) => {return [e.label, e.value]}));

    const changes = currentLabels
      .filter(({ label }) => {return !matchedLabels.has(label)})
      .map(({ label, value }) => {
        const prevValue = prevValueMap.get(label);
        if (prevValue === undefined) return null;
        if (prevValue === value) return null;
        const isIdenticalValueChange =
          !!traceOptions.detectIdenticalValueChanges &&
          areValuesIdentical(prevValue, value);
        return {
          name: label,
          value,
          prevValue,
          hook: null as unknown as Hook,
          isIdenticalValueChange,
        } as StateChangeEntry;
      })
      .filter((c): c is StateChangeEntry => {return c !== null});

    // preserve side-effect timing post computation
    savePrevLabelsForGuid(trackingGUID);

    return changes;
  })();

  return [...fiberStateChanges, ...unmatchedLabelChanges];
}
