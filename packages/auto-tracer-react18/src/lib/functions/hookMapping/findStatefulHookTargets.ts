/**
 * @file Identifies indices of stateful hooks in the _debugHookTypes blueprint.
 */

/**
 * Set of hook types that maintain stateful queues in React's internal structure.
 */
const STATEFUL_HOOK_TYPES = new Set([
  "useState",
  "useReducer",
  "useSyncExternalStore",
]);

/**
 * Extracts the indices of stateful hooks from the _debugHookTypes array.
 *
 * This function scans the comprehensive hook blueprint and returns the positions
 * where stateful hooks appear. These positions serve as "targets" that anchors
 * (runtime hooks with queues) will map to.
 *
 * @param debugHookTypes - The _debugHookTypes array from a React fiber node
 * @returns A readonly array of indices where stateful hooks appear in the blueprint
 *
 * @example
 * const types = ['useState', 'useRef', 'useMemo', 'useSyncExternalStore'];
 * const targets = findStatefulHookTargets(types);
 * // Returns: [0, 3]
 */
export function findStatefulHookTargets(
  debugHookTypes: readonly string[] | null | undefined
): readonly number[] {
  if (!debugHookTypes) {
    return [];
  }

  const targets: number[] = [];

  for (let i = 0; i < debugHookTypes.length; i++) {
    const hookType = debugHookTypes[i];
    if (hookType && STATEFUL_HOOK_TYPES.has(hookType)) {
      targets.push(i);
    }
  }

  return targets;
}
