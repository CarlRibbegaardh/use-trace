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
   * The actual hook instance from the memoizedState chain.
   * Null for unmatched labeled states that don't correspond to a current hook.
   */
  hook: {
    memoizedState: unknown;
    queue: unknown;
    next: unknown;
  } | null;
}

export type { StateValue };
