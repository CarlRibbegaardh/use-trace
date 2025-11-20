/**
 * @file Resolves the correct label for a hook using anchor-target mapping.
 */

import type { Hook } from "./types.js";
import { traceOptions } from "../../types/globalState.js";

/**
 * Resolves the build-time label for a hook using anchor-target mapping algorithm.
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
  const shouldLogDetail = traceOptions.enableAutoTracerInternalsLogging;

  if (shouldLogDetail) {
    console.group(
      `[AutoTracer] resolveHookLabel: ENTER (fallback="${fallback}")`
    );
    console.log(
      `[AutoTracer] resolveHookLabel: Input - anchors.length=${
        anchors.length
      }, targets.length=${targets.length}, labels keys=${
        Object.keys(labels).length
      }`
    );
  }

  if (shouldLogDetail) {
    console.log(`[AutoTracer] resolveHookLabel: Finding hook in anchors array`);
  }

  const anchorIndex = anchors.indexOf(hook);

  if (shouldLogDetail) {
    console.log(`[AutoTracer] resolveHookLabel: anchorIndex=${anchorIndex}`);
  }

  if (anchorIndex === -1) {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: EXIT - Hook not found in anchors, returning fallback="${fallback}"`
      );
      console.groupEnd();
    }
    return fallback;
  }

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: Looking up target at anchors[${anchorIndex}]`
    );
  }

  const targetIndex = targets[anchorIndex];

  if (shouldLogDetail) {
    console.log(`[AutoTracer] resolveHookLabel: targetIndex=${targetIndex}`);
  }

  if (targetIndex === undefined) {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: EXIT - Target undefined at index ${anchorIndex}, returning fallback="${fallback}"`
      );
      console.groupEnd();
    }
    return fallback;
  }

  if (shouldLogDetail) {
    console.log(
      `[AutoTracer] resolveHookLabel: Looking up label at labels[${targetIndex}]`
    );
  }

  const label = labels[targetIndex];

  if (shouldLogDetail) {
    console.log(`[AutoTracer] resolveHookLabel: label="${label}"`);
  }

  if (!label) {
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] resolveHookLabel: EXIT - No label found at targetIndex ${targetIndex}, returning fallback="${fallback}"`
      );
      console.groupEnd();
    }
    return fallback;
  }

  if (shouldLogDetail) {
    console.log(`[AutoTracer] resolveHookLabel: EXIT - returning "${label}"`);
    console.groupEnd();
  }

  return label;
}
