/**
 * JSON replacer function for handling functions in stringify operations.
 */

import { getFunctionId } from "./getFunctionId.js";

/**
 * Replace functions in objects/arrays with (fn:ID) markers.
 *
 * @param key - The property key
 * @param value - The property value
 * @returns The value to use in stringification
 */
export function functionReplacer(key: string, value: unknown): unknown {
  if (typeof value === "function") {
    const id = getFunctionId(value);
    return `(fn:${id})`;
  }
  return value;
}
