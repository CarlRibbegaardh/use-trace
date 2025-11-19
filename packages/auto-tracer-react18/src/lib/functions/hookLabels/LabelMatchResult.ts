/**
 * @file Result type for hook label matching operations.
 */

/**
 * Represents the result of attempting to match a hook to a label.
 */
export interface LabelMatchResult {
  /** Whether a definitive match was found */
  readonly success: boolean;
  /** The matched label name (if success=true), or possible labels (if ambiguous) */
  readonly labels: readonly string[];
  /** Whether the result is ambiguous (multiple possible matches) */
  readonly isAmbiguous: boolean;
}
