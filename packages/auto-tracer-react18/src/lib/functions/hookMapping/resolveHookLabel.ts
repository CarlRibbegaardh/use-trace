/**
 * @file Resolves the correct label for a hook using anchor-target mapping.
 */

import type { Hook } from "./types.js";

/**
 * Resolves the build-time label for a hook using the anchor-target mapping algorithm.
 *
 * This function implements the core mapping logic:
 * 1. Find the hook's position in the memoizedState chain (anchor position)
 * 2. Find which anchor index this corresponds to (among hooks with queues)
 * 3. Map to the same index in the targets array (stateful hooks in _debugHookTypes)
 * 4. Use the target index to look up the label
 *
 * @param hook - The hook instance to resolve a label for
 * @param anchors - Array of all hooks with queues, in chain order
 * @param chainIndexMap - Map from hook instance to its chain position
 * @param targets - Array of _debugHookTypes indices for stateful hooks
 * @param labels - Label registry indexed by _debugHookTypes position
 * @param fallback - Fallback name if no label is found
 * @returns The resolved label or the fallback name
 *
 * @example
 * const label = resolveHookLabel(
 *   someHook,
 *   [anchor0, anchor7, anchor14],
 *   chainMap,
 *   [0, 9, 18],
 *   { 0: 'dispatch', 9: 'filteredTodos', 18: 'loading' },
 *   'state7'
 * );
 * // If someHook is anchor7, returns 'filteredTodos'
 */
export function resolveHookLabel(
  hook: Hook,
  anchors: readonly Hook[],
  _chainIndexMap: ReadonlyMap<Hook, number>,
  targets: readonly number[],
  labels: Record<number, string>,
  fallback: string
): string {
  const anchorIndex = anchors.indexOf(hook);

  if (anchorIndex === -1) {
    return fallback;
  }

  const targetIndex = targets[anchorIndex];

  if (targetIndex === undefined) {
    return fallback;
  }

  const label = labels[targetIndex];

  if (!label) {
    return fallback;
  }

  return label;
}
