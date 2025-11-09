/**
 * Represents a stateful hook's current and previous values.
 */
interface StateValue {
  /**
   * The name of the state (e.g., "state0", "state7")
   */
  name: string;

  /**
   * The current memoized state value
   */
  value: unknown;

  /**
   * The previous memoized state value (from alternate fiber)
   */
  prevValue?: unknown;

  /**
   * The actual hook instance from the memoizedState chain
   */
  hook: {
    memoizedState: unknown;
    queue: unknown;
    next: unknown;
  };
}

export type { StateValue };
