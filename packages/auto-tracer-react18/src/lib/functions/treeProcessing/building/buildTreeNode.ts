import type { TreeNode } from "../types/TreeNode.js";
import type { Hook } from "../../hookMapping/types.js";
import { extractUseStateValues } from "../../extractUseStateValues.js";
import { getComponentName } from "../../getComponentName.js";
import { getRealComponentName } from "../../getRealComponentName.js";
import { getTrackingGUID } from "../../renderRegistry.js";
import { determineRenderType } from "./helpers/determineRenderType.js";
import { getHookAnchors } from "./helpers/getHookAnchors.js";
import { type StateChangeEntry, buildStateChanges } from "./helpers/buildStateChanges.js";
import { buildPropChanges } from "./helpers/buildPropChanges.js";
import { computeIdenticalValueWarning } from "./helpers/computeIdenticalValueWarning.js";
import { consumeComponentLogs } from "./helpers/consumeComponentLogs.js";

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
export function buildTreeNode(
  fiber: unknown,
  depth: number
): TreeNode {
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
  const renderType: TreeNode["renderType"] = determineRenderType(
    isNewMount,
    fiberNode.flags
  );

  // Extract state changes
  const useStateValues = extractUseStateValues(fiberNode);

  // Get hook anchors for label resolution from CURRENT render's memoized state
  const memoizedState = fiberNode.memoizedState as Hook | null;
  const { anchors, allAnchors } = getHookAnchors(memoizedState);

  const stateChanges: StateChangeEntry[] = buildStateChanges(
    isNewMount,
    useStateValues,
    anchors,
    allAnchors,
    trackingGUID || null
  );

  // Extract prop changes
  const propChanges = buildPropChanges(isNewMount, fiberNode, displayName);

  // Check if any change has identical value warning
  const hasIdenticalValueWarning = computeIdenticalValueWarning(
    stateChanges,
    propChanges
  );

  // Get component logs if tracked (logs are keyed by GUID)
  const componentLogs = consumeComponentLogs(trackingGUID || null);

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
