/**
 * Represents a deferred console operation.
 * Pure data structure for strategy pattern dispatch.
 */
export interface LogAction {
  /**
   * The console function to invoke
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly logFn: (...args: any[]) => void;

  /**
   * Arguments to pass to the log function
   */
  readonly args: readonly unknown[];
}
