import type { StateValue } from "../interfaces/StateValue.js";
import { logWarn } from "./log.js";
//import { extractHookNameFromFiber } from "./extractHookNameFromFiber.js";

export function extractUseStateValues(
  fiberNode: Record<string, unknown>
): Array<StateValue> {
  const stateValues: Array<StateValue> = [];

  try {
    // Validate fiber node structure
    if (!fiberNode || typeof fiberNode !== "object") {
      return stateValues;
    }

    const fiberNodeTyped = fiberNode as {
      memoizedState?: Record<string, unknown>;
      alternate?: Record<string, unknown>;
    };

    // Get current and previous state chains
    let currentHook = fiberNodeTyped.memoizedState as unknown;
    let prevHook = (
      fiberNodeTyped.alternate as unknown as { memoizedState?: unknown }
    )?.memoizedState;
    let hookIndex = 0;

    // Walk through the hook chain to find useState hooks
    while (currentHook && hookIndex < 20) {
      const typedHook = currentHook as {
        memoizedState?: unknown;
        queue?: unknown;
        next?: unknown;
      };
      const typedPrevHook = prevHook as
        | { memoizedState?: unknown; next?: unknown }
        | undefined;

      // useState hooks have a queue for updates (memoizedState can be undefined)
      if (typedHook.queue) {
        const currentValue = typedHook.memoizedState;
        const prevValue = typedPrevHook?.memoizedState;

        // Try to extract a meaningful name by looking at the fiber string
        // const hookName = extractHookNameFromFiber(
        //   fiberNode,
        //   currentValue,
        //   hookIndex
        // );
        // Name states by their global hook position to match test expectations
        const hookName = `state${hookIndex}`;

        stateValues.push({
          name: hookName,
          value: currentValue,
          prevValue: prevValue,
          hook: typedHook as { memoizedState: unknown; queue: unknown; next: unknown },
        });
      }

      // Move to next hook
      currentHook = typedHook.next;
      prevHook = typedPrevHook?.next;
      hookIndex++;
    }
  } catch (error) {
    // Handle errors in fiber traversal - React internals may change
    logWarn("AutoTracer: Error extracting useState values:", error);
  }

  return stateValues;
}
