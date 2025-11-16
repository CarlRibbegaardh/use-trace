import type { TreeNode } from "../../types/TreeNode.js";
import { hasRenderWork } from "../../../reactFiberFlags.js";

/**
 * Determine the render type for a fiber based on mount status and flags.
 *
 * Pure function; no side effects.
 *
 * @param isNewMount - Whether the fiber has no alternate (first mount)
 * @param flags - React fiber flags for the current render
 * @returns The render type classification
 */
export function determineRenderType(
  isNewMount: boolean,
  flags: number | undefined
): TreeNode["renderType"] {
  if (isNewMount) {
    return "Mount";
  }
  const f = flags ?? 0;
  return hasRenderWork(f) ? "Rendering" : "Skipped";
}
