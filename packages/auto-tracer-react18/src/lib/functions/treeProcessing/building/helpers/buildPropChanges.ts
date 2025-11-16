import { isReactInternal } from "../../../isReactInternal.js";
import { extractPropChanges } from "../../../extractPropChanges.js";
import { areValuesIdentical } from "../../../areValuesIdentical.js";
import { traceOptions } from "../../../../types/globalState.js";
import { getSkippedProps } from "../../../getSkippedProps.js";

export interface FiberLikePropsNode {
  memoizedProps?: Record<string, unknown>;
  pendingProps?: Record<string, unknown>;
  alternate?: { memoizedProps?: Record<string, unknown> } | unknown;
}

export interface PropChangeEntry {
  name: string;
  value: unknown;
  prevValue: unknown;
  isIdenticalValueChange?: boolean;
}

/**
 * Build property changes for mount/update. Pure; no side effects.
 *
 * @param isNewMount - Whether this is the first mount of the component
 * @param fiberNode - Fiber-like node containing props and alternate
 * @param displayName - Component display name for prop skipping
 * @returns List of prop change entries
 */
export function buildPropChanges(
  isNewMount: boolean,
  fiberNode: FiberLikePropsNode,
  displayName?: string | null
): PropChangeEntry[] {
  if (isNewMount) {
    const currentProps = fiberNode.memoizedProps || fiberNode.pendingProps;
    const result: PropChangeEntry[] = [];
    if (currentProps && typeof currentProps === "object") {
      const skipped = getSkippedProps(displayName || undefined);
      for (const [name, value] of Object.entries(currentProps)) {
        if (isReactInternal(name) || name === "children" || skipped.has(name)) {
          continue;
        }
        result.push({
          name,
          value,
          prevValue: undefined,
          isIdenticalValueChange: false,
        });
      }
    }
    return result;
  }

  const raw = extractPropChanges(
    fiberNode as {
      memoizedProps?: Record<string, unknown>;
      pendingProps?: Record<string, unknown>;
      alternate?: { memoizedProps?: Record<string, unknown> };
    },
    displayName || undefined
  );

  return raw.map((change) => {
    const isIdenticalValueChange =
      !!traceOptions.detectIdenticalValueChanges &&
      change.prevValue !== change.value &&
      areValuesIdentical(change.prevValue, change.value);
    return { ...change, isIdenticalValueChange } as PropChangeEntry;
  });
}
