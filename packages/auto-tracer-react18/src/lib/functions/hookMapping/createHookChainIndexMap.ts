/**
 * @file Creates a map from each hook instance to its position in the chain.
 */

import type { Hook } from "./types.js";

/**
 * Builds a map from each hook instance to its position in the memoizedState chain.
 *
 * This function walks the hook chain and records the position (0, 1, 2, ...) of each
 * hook. This position corresponds to the hook's "state" name as extracted by
 * extractUseStateValues (e.g., state0, state7, state14).
 *
 * @param firstHook - The first hook in the memoizedState chain (fiber.memoizedState)
 * @returns A readonly map where keys are hook instances and values are their chain positions
 *
 * @example
 * const chainMap = createHookChainIndexMap(fiber.memoizedState);
 * chainMap.get(someHook); // Returns: 7 (if that hook is the 8th in the chain)
 */
export function createHookChainIndexMap(
  firstHook: Hook | null | undefined
): ReadonlyMap<Hook, number> {
  if (!firstHook) {
    return new Map();
  }

  const chainMap = new Map<Hook, number>();
  let currentHook: Hook | null = firstHook;
  let position = 0;

  while (currentHook) {
    chainMap.set(currentHook, position);
    currentHook = currentHook.next;
    position++;
  }

  return chainMap;
}
