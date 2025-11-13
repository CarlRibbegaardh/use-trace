/* eslint-disable @typescript-eslint/ban-types */
/**
 * @file Function Instance Tracking (Value Equality Normalization)
 *
 * Function identity tracking for stringify operations.
 *
 * Assigns unique numeric IDs to function instances to enable Value Equality Normalization.
 * Each function reference gets a unique ID, allowing distinction between different instances.
 *
 * **Purpose**: Support `stringify` in producing `"(fn:N)"` format for display/debugging
 *
 * **Not used by**: `normalizeValue` (Structural Comparison) which uses literal `"(fn)"`
 *
 * @see {@link stringify} which uses this for Value Equality Normalization
 * @see {@link normalizeValue} which does NOT use this (uses literal string instead)
 */

/**
 * WeakMap to track function identities across stringifications.
 * Maps function references to unique numeric IDs.
 *
 * **Purpose**: Enable Value Equality Normalization
 * - Same function reference → same ID
 * - Different function instances → different IDs
 */
const functionIdMap = new WeakMap<Function, number>();

/**
 * Counter for generating unique function IDs.
 */
let nextFunctionId = 1;

/**
 * Gets or assigns a unique numeric ID for a function instance.
 *
 * **Normalization Type**: Value Equality Normalization
 * - Same function reference always gets the same ID
 * - Different function instances get different IDs
 * - Used by `stringify` to produce `"(fn:N)"` format
 *
 * **Not used by**: Structural Comparison Normalization (`normalizeValue`)
 *
 * @param fn - The function to get an ID for
 * @returns The numeric ID for this function instance
 *
 * @example
 * ```typescript
 * const fn1 = () => {};
 * const fn2 = () => {};
 *
 * getFunctionId(fn1); // → 1
 * getFunctionId(fn1); // → 1 (same reference, same ID)
 * getFunctionId(fn2); // → 2 (different reference, different ID)
 * ```
 */
export function getFunctionId(fn: Function): number {
  const existing = functionIdMap.get(fn);
  if (existing !== undefined) {
    return existing;
  }

  const id = nextFunctionId++;
  functionIdMap.set(fn, id);
  return id;
}
