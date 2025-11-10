import type { TreeNode } from "../types/TreeNode.js";
import type { Hook } from "../../hookMapping/types.js";
import { extractUseStateValues } from "../../extractUseStateValues.js";
import { extractPropChanges } from "../../extractPropChanges.js";
import { getComponentName } from "../../getComponentName.js";
import { getRealComponentName } from "../../getRealComponentName.js";
import { getTrackingGUID } from "../../renderRegistry.js";
import { hasRenderWork } from "../../reactFiberFlags.js";
import { isReactInternal } from "../../isReactInternal.js";
import { AUTOTRACER_STATE_MARKER } from "../../../types/marker.js";
import { areValuesIdentical } from "../../areValuesIdentical.js";
import { traceOptions } from "../../../types/globalState.js";
import { componentLogRegistry } from "../../componentLogRegistry.js";
import { findStatefulHookAnchors } from "../../hookMapping/findStatefulHookAnchors.js";
import { resolveHookLabel } from "../../hookLabels.js";

/**
 * Builds a TreeNode from a React fiber node.
 *
 * Pure function - extracts data without modifying the fiber.
 * Total function - handles all fiber inputs safely.
 *
 * @param fiber - The React fiber node
 * @param depth - Current depth in the tree
 * @returns Immutable TreeNode representation
 */
export function buildTreeNode(fiber: unknown, depth: number): TreeNode {
  if (!fiber || typeof fiber !== "object") {
    throw new Error("buildTreeNode requires a valid fiber object");
  }

  const fiberNode = fiber as {
    elementType?: unknown;
    type?: unknown;
    alternate?: unknown;
    flags?: number;
    memoizedProps?: Record<string, unknown>;
    pendingProps?: Record<string, unknown>;
    memoizedState?: unknown;
  };

  // Extract component name
  const componentName = getComponentName(fiberNode.elementType) ?? "Unknown";
  const displayName = getRealComponentName(fiberNode);

  // Determine if this is a mount (new component instance)
  const isNewMount = !fiberNode.alternate;

  // Check if component is tracked
  const trackingGUID = getTrackingGUID(fiber);
  const isTracked = !!trackingGUID;

  // Determine render type
  let renderType: TreeNode["renderType"];
  if (isNewMount) {
    renderType = "Mount";
  } else {
    const flags = fiberNode.flags ?? 0;
    if (hasRenderWork(flags)) {
      renderType = "Rendering";
    } else {
      renderType = "Skipped";
    }
  }

  // Extract state changes
  const useStateValues = extractUseStateValues(fiberNode);

  // Get hook anchors for label resolution from CURRENT render's memoized state
  // (This is needed to match the hook chain and resolve variable names correctly)
  const memoizedState = fiberNode.memoizedState as Hook | null;
  const anchors = findStatefulHookAnchors(memoizedState);

  // Map anchors to the format expected by resolveHookLabel
  const allAnchors = anchors.map((anchor, idx) => ({
    index: idx,
    value: anchor.memoizedState,
  }));

  const stateChanges = useStateValues
    .filter(({ name, value, prevValue }) => {
      return (
        prevValue !== undefined &&
        prevValue !== value &&
        !isReactInternal(name) &&
        value !== AUTOTRACER_STATE_MARKER &&
        prevValue !== AUTOTRACER_STATE_MARKER
      );
    })
    .map(({ name, value, prevValue, hook }) => {
      // Detect identical values
      const isIdenticalValueChange =
        !!traceOptions.detectIdenticalValueChanges &&
        prevValue !== value &&
        areValuesIdentical(prevValue, value);

      // Resolve the actual variable name using hook label resolution
      const anchorIndex = anchors.indexOf(hook as Hook);
      const resolvedName = resolveHookLabel(
        trackingGUID ?? "",
        anchorIndex,
        (hook as Hook).memoizedState,
        allAnchors
      );

      return {
        name: resolvedName, // Use resolved name instead of generic fallback
        value,
        prevValue,
        hook,
        isIdenticalValueChange,
      };
    });

  // Extract prop changes
  const rawPropChanges = extractPropChanges(
    fiberNode as {
      memoizedProps?: Record<string, unknown>;
      pendingProps?: Record<string, unknown>;
      alternate?: { memoizedProps?: Record<string, unknown> };
    },
    displayName || undefined
  );

  // Add identical value change detection to prop changes
  const propChanges = rawPropChanges.map((change) => {
    // Detect identical values
    const isIdenticalValueChange =
      !!traceOptions.detectIdenticalValueChanges &&
      change.prevValue !== change.value &&
      areValuesIdentical(change.prevValue, change.value);

    return {
      ...change,
      isIdenticalValueChange,
    };
  });

  // Check if any change has identical value warning
  const hasIdenticalValueWarning =
    stateChanges.some((change) => change.isIdenticalValueChange === true) ||
    propChanges.some((change) => change.isIdenticalValueChange === true);

  // Get component logs if tracked (logs are keyed by GUID)
  const componentLogs = trackingGUID
    ? componentLogRegistry.consumeLogs(trackingGUID)
    : [];

  return {
    depth,
    componentName,
    displayName,
    renderType,
    flags: fiberNode.flags ?? 0,
    stateChanges,
    propChanges,
    componentLogs,
    isTracked,
    trackingGUID: trackingGUID || null,
    hasIdenticalValueWarning,
  };
}
