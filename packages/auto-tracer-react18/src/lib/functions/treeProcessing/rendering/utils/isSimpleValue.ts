/**
 * Determines if a value should be rendered inline vs multi-line in object mode.
 * Simple values (primitives, functions, short strings) render inline.
 * Complex values (objects, arrays) render multi-line with Before/After.
 *
 * @param value - The value to check
 * @returns True if value should render inline
 */
export function isSimpleValue(value: unknown): boolean {
  // Primitives are simple
  if (value === null || value === undefined) {
    return true;
  }

  const type = typeof value;

  if (type === "boolean" || type === "number" || type === "bigint") {
    return true;
  }

  if (type === "function") {
    return true;
  }

  if (type === "string") {
    // Short strings are simple, long ones are complex
    return (value as string).length <= 50;
  }

  // Objects and arrays are complex
  return false;
}
