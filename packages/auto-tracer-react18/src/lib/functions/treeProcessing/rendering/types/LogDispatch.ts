/**
 * Represents a deferred console log operation.
 * Pure data structure that describes what to log without executing side effects.
 */
export interface LogDispatch {
  /**
   * The log function to call (e.g., logStateChange, logPropChange, etc.)
   */
  readonly logFn: (...args: unknown[]) => void;

  /**
   * Arguments to pass to the log function
   */
  readonly args: readonly unknown[];
}
