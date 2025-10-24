import type { PropChange } from "../interfaces/PropChange.js";
import { isReactInternal } from "./isReactInternal.js";
import { getSkippedProps } from "./getSkippedProps.js";

export function extractPropChanges(
  fiberNode: {
    memoizedProps?: Record<string, unknown>;
    pendingProps?: Record<string, unknown>;
    alternate?: { memoizedProps?: Record<string, unknown> };
  },
  componentName?: string
): Array<PropChange> {
  const propChanges: Array<PropChange> = [];

  try {
    const currentProps = fiberNode.memoizedProps || fiberNode.pendingProps;
    const prevProps = fiberNode.alternate?.memoizedProps;

    if (!currentProps || !prevProps) return propChanges;

    // Get skipped props for this component
    const skippedProps = getSkippedProps(componentName);

    // Compare current props with previous props
    for (const [propName, currentValue] of Object.entries(currentProps)) {
      const prevValue = prevProps[propName];

      // Skip React internals, children, and configured skipped props
      if (
        isReactInternal(propName) ||
        propName === "children" ||
        skippedProps.has(propName)
      ) {
        continue;
      }

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
