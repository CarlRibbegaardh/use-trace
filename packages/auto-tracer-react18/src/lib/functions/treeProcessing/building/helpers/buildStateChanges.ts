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
  const shouldLogDetail =
    traceOptions.enableAutoTracerInternalsLogging ?? false;

  if (shouldLogDetail) {
    console.group(
      `[AutoTracer] buildStateChanges: ENTER (mount=${isNewMount}, useStateValues=${useStateValues.length}, trackingGUID=${trackingGUID})`
    );
  }

  if (isNewMount) {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] buildStateChanges: Processing mount - filtering ${useStateValues.length} useState values`
      );
    }
    const fiberStateChanges = useStateValues
      .filter(({ name, value }) => {
        return !isReactInternal(name) && value !== AUTOTRACER_STATE_MARKER;
      })
      .map(({ value, hook }) => {
        if (shouldLogDetail) {
          console.log(
            `[AutoTracer] buildStateChanges: Resolving hook label (mount)`
          );
          console.log(
            `[AutoTracer] buildStateChanges: About to call anchors.indexOf(hook)`
          );
          console.log(
            `[AutoTracer] buildStateChanges: hook type=${typeof hook}, hook=${hook ? "exists" : "null"}`
          );
          console.log(
            `[AutoTracer] buildStateChanges: anchors.length=${anchors.length}`
          );
        }
        const anchorIndex = anchors.indexOf(hook as unknown as Hook);
        if (shouldLogDetail) {
          console.log(
            `[AutoTracer] buildStateChanges: Got anchorIndex=${anchorIndex}`
          );
        }
        const resolvedName = resolveHookLabel(
          trackingGUID ?? "",
          anchorIndex,
          (hook as Hook).memoizedState,
          allAnchors
        );
        if (shouldLogDetail) {
          console.log(
            `[AutoTracer] buildStateChanges: Resolved to "${resolvedName}"`
          );
        }
        return {
          name: resolvedName,
          value,
          prevValue: undefined as unknown,
          hook,
          isIdenticalValueChange: false,
        } as StateChangeEntry;
      });

    const matchedLabels = new Set(
      fiberStateChanges.map((c) => {
        return c.name;
      })
    );

    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] buildStateChanges: Getting unmatched labels for GUID (mount)`
      );
    }
    const unmatchedLabelChanges = trackingGUID
      ? getLabelsForGuid(trackingGUID)
          .filter(({ label }) => {
            return !matchedLabels.has(label);
          })
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

    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] buildStateChanges: EXIT (mount) - ${
          fiberStateChanges.length
        } fiber + ${unmatchedLabelChanges.length} unmatched = ${
          fiberStateChanges.length + unmatchedLabelChanges.length
        } total`
      );
      console.groupEnd();
    }
    return [...fiberStateChanges, ...unmatchedLabelChanges];
  }

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] buildStateChanges: Processing update - filtering ${useStateValues.length} useState values`
    );
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
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] buildStateChanges: Checking identical value (update)`
        );
      }
      const isIdenticalValueChange =
        !!traceOptions.detectIdenticalValueChanges &&
        prevValue !== value &&
        areValuesIdentical(prevValue, value);

      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] buildStateChanges: Resolving hook label (update)`
        );
      }
      const anchorIndex = anchors.indexOf(hook as unknown as Hook);
      const resolvedName = resolveHookLabel(
        trackingGUID ?? "",
        anchorIndex,
        (hook as Hook).memoizedState,
        allAnchors
      );
      if (shouldLogDetail) {
        console.log(
          `[AutoTracer] buildStateChanges: Resolved to "${resolvedName}"`
        );
      }

      return {
        name: resolvedName,
        value,
        prevValue,
        hook,
        isIdenticalValueChange,
      } as StateChangeEntry;
    });

  const matchedLabels = new Set(
    fiberStateChanges.map((c) => {
      return c.name;
    })
  );

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] buildStateChanges: Getting unmatched labels for GUID (update)`
    );
  }
  const unmatchedLabelChanges = (() => {
    if (!trackingGUID) return [] as StateChangeEntry[];

    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] buildStateChanges: Getting current and prev labels`
      );
    }
    const currentLabels = getLabelsForGuid(trackingGUID);
    const prevLabels = getPrevLabelsForGuid(trackingGUID);

    if (shouldLogDetail) {
      console.log(`[AutoTracer] buildStateChanges: Building prevValueMap`);
    }
    const prevValueMap = new Map(
      prevLabels.map((e) => {
        return [e.label, e.value];
      })
    );

    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] buildStateChanges: Filtering and mapping changes`
      );
    }
    const changes = currentLabels
      .filter(({ label }) => {
        return !matchedLabels.has(label);
      })
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
      .filter((c): c is StateChangeEntry => {
        return c !== null;
      });

    if (shouldLogDetail) {
      console.log(`[AutoTracer] buildStateChanges: Saving prev labels`);
    }
    // preserve side-effect timing post computation
    savePrevLabelsForGuid(trackingGUID);

    return changes;
  })();

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] buildStateChanges: EXIT (update) - ${
        fiberStateChanges.length
      } fiber + ${unmatchedLabelChanges.length} unmatched = ${
        fiberStateChanges.length + unmatchedLabelChanges.length
      } total`
    );
    console.groupEnd();
  }
  return [...fiberStateChanges, ...unmatchedLabelChanges];
}
