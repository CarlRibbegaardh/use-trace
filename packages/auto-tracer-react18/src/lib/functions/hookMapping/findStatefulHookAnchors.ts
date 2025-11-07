/**
 * @file Extracts hooks with queues from the memoizedState chain.
 */

import type { Hook } from "./types.js";

/**
 * Extracts all hooks that have a queue property from the memoizedState linked list.
 *
 * This function walks the memoizedState chain and collects "anchors" - hooks that
 * have a queue property, indicating they are stateful. These anchors will be mapped
 * to their corresponding targets in the _debugHookTypes array.
 *
 * @param firstHook - The first hook in the memoizedState chain (fiber.memoizedState)
 * @returns A readonly array of hooks that have queue properties
 *
 * @example
 * const anchors = findStatefulHookAnchors(fiber.memoizedState);
 * // Returns: [hook0, hook7, hook14] where each has a non-null queue
 */
export function findStatefulHookAnchors(
  firstHook: Hook | null | undefined
): readonly Hook[] {
  if (!firstHook) {
    return [];
  }

  const anchors: Hook[] = [];
  let currentHook: Hook | null = firstHook;

  while (currentHook) {
    if (currentHook.queue !== null && currentHook.queue !== undefined) {
      anchors.push(currentHook);
    }
    currentHook = currentHook.next;
  }

  return anchors;
}
