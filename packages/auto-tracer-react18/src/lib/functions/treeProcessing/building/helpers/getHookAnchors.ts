import type { Hook } from "../../../hookMapping/types.js";
import { findStatefulHookAnchors } from "../../../hookMapping/findStatefulHookAnchors.js";

export interface AnchorEntry {
  index: number;
  value: unknown;
}

/**
 * Resolve stateful hook anchors from a memoizedState chain and map them into
 * a simplified structure suitable for label resolution. Pure; no side effects.
 *
 * @param memoizedState - The fiber's current memoizedState chain
 * @returns Anchors array and mapped entries for label resolution
 */
export function getHookAnchors(
  memoizedState: Hook | null
): { anchors: readonly Hook[]; allAnchors: AnchorEntry[] } {
  const anchors = findStatefulHookAnchors(memoizedState);
  const allAnchors = anchors.map((anchor, idx) => {
    return { index: idx, value: anchor.memoizedState } as AnchorEntry;
  });
  return { anchors, allAnchors };
}
