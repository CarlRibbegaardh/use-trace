/**
 * Calculates how many console groups should be closed.
 * Pure function with no side effects.
 *
 * Groups are closed when traversing up or across the tree.
 * We close all groups whose depth is >= the target depth,
 * leaving us nested inside the parent group.
 *
 * @param targetDepth - The depth we're moving to
 * @param depthStack - Current stack of open group depths (deepest last)
 * @returns Number of groups to close
 */
export function computeCloseCount(
  targetDepth: number,
  depthStack: readonly number[],
): number {
  let closeCount = 0;

  // Count from the end (deepest groups) backwards
  for (let i = depthStack.length - 1; i >= 0; i--) {
    const stackDepth = depthStack[i];
    if (stackDepth !== undefined && stackDepth >= targetDepth) {
      closeCount++;
    } else {
      break;
    }
  }

  return closeCount;
}
