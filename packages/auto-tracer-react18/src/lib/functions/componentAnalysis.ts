import { getComponentName } from "./getComponentName.js";
import { getRealComponentName } from "./getRealComponentName.js";
import { getTrackingGUID } from "./renderRegistry.js";
import { Placement, hasRenderWork } from "./reactFiberFlags.js";
import type { FiberNode } from "./fiberTraversal.js";

/**
 * Analysis result for a component fiber
 */
export interface ComponentAnalysis {
  componentName: string | null;
  realComponentName: string | null;
  displayName: string | null;
  trackingGUID: string | null;
  isTracked: boolean;
  renderType: RenderType;
  flags: number;
  isMount: boolean;
}

/**
 * Types of render operations
 */
export type RenderType = "Mount" | "Rendering" | "Reconciled" | "Skipped";

/**
 * Component display information for logging
 */
export interface ComponentDisplayInfo {
  displayName: string | null;
  isTracked: boolean;
  renderType: RenderType;
  flags: number;
  hasFlags: boolean;
}

/**
 * Analyze a component fiber to extract information needed for processing
 */
export function analyzeComponentFiber(fiber: unknown): ComponentAnalysis | null {
  if (!fiber || typeof fiber !== "object") {
    return null;
  }

  const fiberNode = fiber as FiberNode;

  // Only analyze component fibers
  if (!fiberNode.elementType) {
    return null;
  }

  const componentName = getComponentName(fiberNode.elementType);
  const realComponentName = getRealComponentName(fiberNode as Record<string, unknown>);
  const displayName = realComponentName !== "Unknown" ? realComponentName : componentName;

  const trackingGUID = getTrackingGUID(fiberNode);
  const isTracked = trackingGUID !== null;

  const renderType = determineRenderType(fiberNode);
  const flags = fiberNode.flags ?? 0;
  const isMount = !fiberNode.alternate;

  return {
    componentName,
    realComponentName,
    displayName,
    trackingGUID,
    isTracked,
    renderType,
    flags,
    isMount,
  };
}

/**
 * Determine the render type of a component fiber
 */
export function determineRenderType(fiberNode: FiberNode): RenderType {
  const hasFlags = fiberNode.flags && fiberNode.flags > 0;
  const isNewMount = !fiberNode.alternate;

  // Be more conservative about what we consider a "Mount"
  // Only consider it a mount if it's both new AND has placement flags
  const flags = fiberNode.flags ?? 0;
  const isActualMount = isNewMount && flags & Placement;

  if (isActualMount) {
    return "Mount";
  } else if (!hasFlags) {
    return "Reconciled";
  } else {
    // Check if component function actually executed
    if (hasRenderWork(flags)) {
      return "Rendering"; // Component function actually ran
    } else {
      return "Skipped"; // React internal work only, function execution skipped
    }
  }
}

/**
 * Check if a component should be tracked based on its analysis and settings
 */
export function shouldTrackComponent(
  analysis: ComponentAnalysis | null,
  _depth: number
): boolean {
  if (!analysis) {
    return false;
  }

  // Always track if the component is explicitly tracked
  if (analysis.isTracked) {
    return true;
  }

  // Additional logic for tracking decisions can be added here
  return true;
}

/**
 * Get display information for a component
 */
export function getComponentDisplayInfo(analysis: ComponentAnalysis): ComponentDisplayInfo {
  return {
    displayName: analysis.displayName,
    isTracked: analysis.isTracked,
    renderType: analysis.renderType,
    flags: analysis.flags,
    hasFlags: analysis.flags > 0,
  };
}

/**
 * Check if a component fiber is a component (has elementType)
 */
export function isComponentFiber(fiber: unknown): boolean {
  if (!fiber || typeof fiber !== "object") {
    return false;
  }

  const fiberNode = fiber as FiberNode;
  return !!fiberNode.elementType;
}
