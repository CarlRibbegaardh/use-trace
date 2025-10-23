import type { PropChange } from "../interfaces/PropChange.js";
import { isReactInternal } from "./isReactInternal.js";

export function extractPropChanges(fiberNode: {
  memoizedProps?: Record<string, unknown>;
  pendingProps?: Record<string, unknown>;
  alternate?: { memoizedProps?: Record<string, unknown> };
}): Array<PropChange> {
  const propChanges: Array<PropChange> = [];

  try {
    const currentProps = fiberNode.memoizedProps || fiberNode.pendingProps;
    const prevProps = fiberNode.alternate?.memoizedProps;

    if (!currentProps || !prevProps) return propChanges;

    // Compare current props with previous props
    for (const [propName, currentValue] of Object.entries(currentProps)) {
      const prevValue = prevProps[propName];

      // Skip React internals and functions (except if they're different references)
      if (isReactInternal(propName) || propName === "children") continue;

      // Detect prop changes
      if (prevValue !== currentValue) {
        propChanges.push({
          name: propName,
          value: currentValue,
          prevValue: prevValue,
        });
      }
    }
  } catch (_error) {
    // Silently handle errors in prop extraction
  }

  return propChanges;
}
