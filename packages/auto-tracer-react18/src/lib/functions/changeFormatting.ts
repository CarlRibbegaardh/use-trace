import { stringifyForDisplay } from "./stringifyForDisplay.js";
import { checkComplexObject } from "./checkComplexObject.js";

/**
 * Format a value for display in prop changes.
 * Large/complex objects show key count instead of full serialization.
 * Functions are always shown as (fn:id) with identity tracking.
 *
 * @param value - The value to format
 * @returns Formatted string for console display
 */
export function formatPropValue(value: unknown): string {
  // Check if object is too complex before stringifying
  const complexCheck = checkComplexObject(value);
  if (complexCheck !== null) {
    return complexCheck;
  }

  return stringifyForDisplay(value);
}

/**
 * Format a prop change for display with size-based truncation.
 *
 * Truncation rules:
 * - < 20 chars: value → value (single line)
 * - 20-200 chars: Multi-line format
 * - 200+ chars: Multi-line with truncated values and character counts
 *
 * @param before - Previous value
 * @param after - New value
 * @returns Formatted change string for console display
 */
export function formatPropChange(before: unknown, after: unknown): string {
  // Check for complex objects first
  const beforeComplex = checkComplexObject(before);
  const afterComplex = checkComplexObject(after);

  const beforeStr = beforeComplex ?? stringifyForDisplay(before);
  const afterStr = afterComplex ?? stringifyForDisplay(after);

  // Apply truncation rules based on total length
  const totalLength = beforeStr.length + afterStr.length;

  if (totalLength < 20) {
    // Short: single line
    return `${beforeStr} → ${afterStr}`;
  } else if (totalLength <= 200) {
    // Medium: multi-line
    return `\n${beforeStr}\n→\n${afterStr}`;
  } else {
    // Long: truncate both values and use multi-line format
    const beforeTrunc =
      beforeStr.length > 200
        ? `${beforeStr.slice(0, 200)}... (${beforeStr.length} characters)`
        : beforeStr;
    const afterTrunc =
      afterStr.length > 200
        ? `${afterStr.slice(0, 200)}... (${afterStr.length} characters)`
        : afterStr;
    return `\n${beforeTrunc}\n→\n${afterTrunc}`;
  }
}

/**
 * Format a state value for display.
 * Large/complex objects show key count instead of full serialization.
 * Functions are always shown as (fn:id) with identity tracking.
 *
 * @param value - The value to format
 * @returns Formatted string for console display
 */
export function formatStateValue(value: unknown): string {
  // Check if object is too complex before stringifying
  const complexCheck = checkComplexObject(value);
  if (complexCheck !== null) {
    return complexCheck;
  }

  return stringifyForDisplay(value);
}

/**
 * Format a state change for display with size-based truncation.
 *
 * Truncation rules:
 * - < 20 chars: value → value (single line)
 * - 20-200 chars: Multi-line format
 * - 200+ chars: Multi-line with truncated values and character counts
 *
 * @param before - Previous value
 * @param after - New value
 * @returns Formatted change string for console display
 */
export function formatStateChange(before: unknown, after: unknown): string {
  // Check for complex objects first
  const beforeComplex = checkComplexObject(before);
  const afterComplex = checkComplexObject(after);

  const beforeStr = beforeComplex ?? stringifyForDisplay(before);
  const afterStr = afterComplex ?? stringifyForDisplay(after);

  // Apply truncation rules based on total length
  const totalLength = beforeStr.length + afterStr.length;

  if (totalLength < 20) {
    // Short: single line
    return `${beforeStr} → ${afterStr}`;
  } else if (totalLength <= 200) {
    // Medium: multi-line
    return `\n${beforeStr}\n→\n${afterStr}`;
  } else {
    // Long: truncate both values and use multi-line format
    const beforeTrunc =
      beforeStr.length > 200
        ? `${beforeStr.slice(0, 200)}... (${beforeStr.length} characters)`
        : beforeStr;
    const afterTrunc =
      afterStr.length > 200
        ? `${afterStr.slice(0, 200)}... (${afterStr.length} characters)`
        : afterStr;
    return `\n${beforeTrunc}\n→\n${afterTrunc}`;
  }
}
