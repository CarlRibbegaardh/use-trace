import { traceOptions } from "../types/globalState.js";

/**
 * Get the set of props that should be skipped for a given component
 * @param componentName The name of the component to check
 * @returns Set of prop names to skip
 */
export function getSkippedProps(componentName?: string): Set<string> {
  const skippedProps = new Set<string>();

  if (componentName && traceOptions.skippedObjectProps) {
    for (const skipConfig of traceOptions.skippedObjectProps) {
      if (skipConfig.objectName === componentName) {
        skipConfig.propNames.forEach((propName) => {
          skippedProps.add(propName);
        });
      }
    }
  }

  return skippedProps;
}
