/**
 * Function identity tracking for stringify operations.
 */

/**
 * WeakMap to track function identities across stringifications.
 * Maps function references to unique numeric IDs.
 */
const functionIdMap = new WeakMap<Function, number>();

/**
 * Counter for generating unique function IDs.
 */
let nextFunctionId = 1;

/**
 * Gets or assigns a unique numeric ID for a function.
 * Same function reference always gets the same ID.
 * Different function instances get different IDs.
 *
 * @param fn - The function to get an ID for
 * @returns The numeric ID for this function
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
