import { stringify } from "./stringify.js";
import { extractPropChanges } from "./extractPropChanges.js";
import { extractUseStateValues } from "./extractUseStateValues.js";
import { getComponentName } from "./getComponentName.js";
import { getRealComponentName } from "./getRealComponentName.js";
import { isReactInternal } from "./isReactInternal.js";
import {
  log,
  logPropChange,
  logReconciled,
  logSkipped,
  logStateChange,
  logStyled,
  logWarn,
} from "./log.js";
import { traceOptions } from "../types/globalState.js";
import { Placement, getFlagNames, hasRenderWork } from "./reactFiberFlags.js";
import { getTrackingGUID } from "./renderRegistry.js";
import { getSkippedProps } from "./getSkippedProps.js";
import { componentLogRegistry } from "./componentLogRegistry.js";

// Track the last depth we processed
let lastDepth = -1;

export function resetDepthTracking(): void {
  lastDepth = -1;
}

function isInParentChainOfTracked(
  fiber: unknown,
  currentDepth: number
): boolean {
  // Check if any descendant at a deeper level is tracked
  function hasTrackedDescendant(node: unknown, depth: number): boolean {
    if (!node || typeof node !== "object") return false;

    const nodeAsFiber = node as {
      elementType?: unknown;
      child?: unknown;
      sibling?: unknown;
    };

    // If this is a component and it's tracked, we found one
    if (nodeAsFiber.elementType && getTrackingGUID(node)) {
      return true;
    }

    // Check children
    if (
      nodeAsFiber.child &&
      hasTrackedDescendant(nodeAsFiber.child, depth + 1)
    ) {
      return true;
    }

    // Check siblings
    if (
      nodeAsFiber.sibling &&
      hasTrackedDescendant(nodeAsFiber.sibling, depth)
    ) {
      return true;
    }

    return false;
  }

  return hasTrackedDescendant(fiber, currentDepth);
}

/**
 * Format a value for display in prop changes, respecting the showFunctionContentOnChange setting
 */
function formatPropValue(value: unknown): string {
  if (typeof value === "function") {
    if (traceOptions.showFunctionContentOnChange) {
      return stringify(value);
    } else {
      return "[Function]";
    }
  }
  return stringify(value);
}

function formatPropChange(before: unknown, after: unknown): string {
  if (
    typeof before === "function" &&
    !traceOptions.showFunctionContentOnChange
  ) {
    return "[Function changed]";
  }

  return `${stringify(before)} → ${stringify(after)}`;
}

function formatStateValue(value: unknown): string {
  if (typeof value === "function") {
    if (traceOptions.showFunctionContentOnChange) {
      return stringify(value);
    } else {
      return "[Function]";
    }
  }
  return stringify(value);
}

function formatStateChange(before: unknown, after: unknown): string {
  if (
    typeof before === "function" &&
    !traceOptions.showFunctionContentOnChange
  ) {
    return "[Function changed]";
  }

  return `${stringify(before)} → ${stringify(after)}`;
}

export function walkFiberForUpdates(fiber: unknown, depth: number): void {
  if (!fiber || typeof fiber !== "object") return;

  // Prevent infinite recursion - use configurable traversal depth limit
  const maxDepth = traceOptions.maxFiberDepth ?? 1000;
  if (depth > maxDepth) {
    logWarn(
      `AutoTracer: Maximum traversal depth (${maxDepth}) reached, stopping to prevent stack overflow`
    );
    return;
  }

  const fiberNode = fiber as {
    elementType?: unknown;
    child?: unknown;
    sibling?: unknown;
    flags?: number;
    alternate?: unknown;
    memoizedProps?: Record<string, unknown>;
    pendingProps?: Record<string, unknown>;
    memoizedState?: unknown;
  };

  // Check if this is a component fiber
  if (fiberNode.elementType) {
    const componentName = getComponentName(fiberNode.elementType);
    const realComponentName = getRealComponentName(fiberNode);

    const indent = "  ".repeat(depth);
    const displayName =
      realComponentName !== "Unknown" ? realComponentName : componentName;

    // Filter: only show tracked components or those in parent chain of tracked components
    const trackingGUID = getTrackingGUID(fiberNode);
    const isTracked = trackingGUID !== null;

    if (traceOptions.skipNonTrackedBranches) {
      const isInParentChain = isInParentChainOfTracked(fiberNode, depth);

      if (!isTracked && !isInParentChain) {
        // Skip this component, but still traverse its children
        if (fiberNode.child) {
          walkFiberForUpdates(fiberNode.child, depth + 1);
        }
        if (fiberNode.sibling) {
          walkFiberForUpdates(fiberNode.sibling, depth);
        }
        return;
      }
    }

    // Determine render type using developer-friendly terms
    const hasFlags = fiberNode.flags && fiberNode.flags > 0;
    const isNewMount = !fiberNode.alternate;

    // Be more conservative about what we consider a "Mount"
    // Only consider it a mount if it's both new AND has placement flags
    const flags = fiberNode.flags ?? 0;
    const isActualMount = isNewMount && flags & Placement;

    let renderType: string;
    if (isActualMount) {
      renderType = "Mount";
    } else if (!hasFlags) {
      renderType = "Reconciled";
    } else {
      // Check if component function actually executed
      if (hasRenderWork(flags)) {
        renderType = "Rendering"; // Component function actually ran
      } else {
        renderType = "Skipped"; // React internal work only, function execution skipped
      }
    }

    // Skip reconciled components if includeReconciled is false
    if (renderType === "Reconciled" && !traceOptions.includeReconciled) {
      // Skip showing this component, but still traverse its children
    } else if (renderType === "Skipped" && !traceOptions.includeSkipped) {
      // Skip showing this component, but still traverse its children
    } else {
      // Show the component with optional flags inline
      const flags = fiberNode.flags ?? 0;
      let flagsDisplay = "";
      if (flags > 0 && traceOptions.showFlags) {
        const flagNames = getFlagNames(flags);
        flagsDisplay = ` (${flagNames.join(", ")})`;
      }

      // Show connecting lines when transitioning to deeper levels
      if (depth > lastDepth && depth > 0) {
        const innerLastDepth = Math.max(lastDepth, 0);
        // If depth increased by more than 1, add connector rows for missing levels
        const depthDifference = depth - innerLastDepth;
        if (depthDifference > 1) {
          // Add connector rows for each missing level
          for (
            let missingLevel = innerLastDepth + 1;
            missingLevel < depth;
            missingLevel++
          ) {
            const missingIndent = "  ".repeat(Math.max(missingLevel - 1, 0));
            log(`${missingIndent}└─┐`);
          }
        }

        // Add the final connector for the current level
        const connectIndent = "  ".repeat(Math.max(depth - 1, 0));
        log(`${connectIndent}└─┐`); //└─┐
      }
      lastDepth = depth;

      // Use appropriate styled logging based on render type and tracking status
      const prefix = `${indent}├─ `;
      const message = `[${displayName}] ${renderType}${flagsDisplay}`;

      if (isTracked) {
        logStyled(prefix, message, true); // Definitive render styling
      } else if (renderType === "Reconciled") {
        logReconciled(prefix, message);
      } else if (renderType === "Skipped") {
        logSkipped(prefix, message);
      } else {
        log(`${prefix}${message}`); // Default styling for other types
      }

      // Extract and show useState changes only if they exist
      const useStateValues = extractUseStateValues(fiberNode);
      const meaningfulStateChanges = useStateValues.filter(
        ({ name, value, prevValue }) => {
          return (
            prevValue !== undefined &&
            prevValue !== value &&
            !isReactInternal(name)
          );
        }
      );

      // Extract prop changes only if they exist
      const propChanges = extractPropChanges(
        fiberNode as {
          memoizedProps?: Record<string, unknown>;
          pendingProps?: Record<string, unknown>;
          alternate?: { memoizedProps?: Record<string, unknown> };
        },
        displayName || undefined
      );

      // For Mount: Show initial values, for others: Show changes
      if (isNewMount) {
        // Show initial props
        const currentProps = fiberNode.memoizedProps || fiberNode.pendingProps;
        if (currentProps && typeof currentProps === "object") {
          // Get skipped props for this component
          const skippedProps = getSkippedProps(displayName || undefined);

          Object.entries(currentProps).forEach(([name, value]) => {
            if (
              !isReactInternal(name) &&
              name !== "children" &&
              !skippedProps.has(name)
            ) {
              logPropChange(
                `${indent}│   `,
                `Initial prop ${name}: ${formatPropValue(value)}`,
                true
              );
            }
          });
        }

        // Show initial useState values
        const allStateValues = extractUseStateValues(fiberNode);
        allStateValues.forEach(({ name, value }) => {
          if (!isReactInternal(name)) {
            logStateChange(
              `${indent}│   `,
              `Initial state: ${formatStateValue(value)}`,
              true
            );
          }
        });
      } else {
        // Show prop changes if any
        propChanges.forEach(({ name, value, prevValue }) => {
          logPropChange(
            `${indent}│   `,
            `Prop change ${name}: ${formatPropChange(prevValue, value)}`
          );
        });

        // Show useState changes if any
        meaningfulStateChanges.forEach(({ name: _name, value, prevValue }) => {
          logStateChange(
            `${indent}│   `,
            `State change: ${formatStateChange(prevValue, value)}`
          );
        });
      }

      // Show component logs if this component was tracked
      if (isTracked && trackingGUID) {
        const componentLogs = componentLogRegistry.consumeLogs(trackingGUID);
        if (componentLogs.length > 0) {
          componentLogs.forEach(({ message: logMessage, args }) => {
            const logPrefix = `${indent}│   Log: `;
            if (args.length > 0) {
              log(`${logPrefix}${logMessage}`, ...args);
            } else {
              log(`${logPrefix}${logMessage}`);
            }
          });
        }
      }

      // Not interesting.
      // // If no changes, show the appropriate status
      // if (
      //   meaningfulStateChanges.length === 0 &&
      //   propChanges.length === 0 &&
      //   !isNewMount
      // ) {
      //   if (renderType === "Rendering") {
      //     console.log(
      //       `${indent}   🔄 function executed (but no tracked changes)`
      //     );
      //   } else if (renderType === "Skipped") {
      //     console.log(
      //       `${indent}   ⚙️ React processed (function execution skipped)`
      //     );
      //   } else if (renderType === "Reconciled") {
      //     console.log(`${indent}   👻 reconciled (no work needed)`);
      //   }
      // }
    }
  }

  // Recursively walk child and sibling fibers
  if (fiberNode.child) {
    walkFiberForUpdates(fiberNode.child, depth + 1);
  }
  if (fiberNode.sibling) {
    walkFiberForUpdates(fiberNode.sibling, depth);
  }
}
