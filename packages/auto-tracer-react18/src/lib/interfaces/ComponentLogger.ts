/**
 * Logger interface for useAutoTracer components
 */
export interface ComponentLogger {
  /**
   * Log a message that will be displayed when the component is rendered by autoTracer
   * @param message The message to log
   * @param args Additional arguments (similar to console.log)
   */
  log: (message: string, ...args: unknown[]) => void;

  /**
   * INTERNAL: Associates a human-readable label with a state hook using its stable index
   * in React's _debugHookTypes ordering. Intended for code injection only.
   *
   * NOTE: The index AND value are REQUIRED. Manual use without the injector is unsupported.
   *
   * @param label Human-readable name for the state hook (e.g., "filteredTodos", "loading")
   * @param index Stable index of the state hook within the component (0-based)
   * @param value Current state value for value-based matching (REQUIRED)
   * @param additionalValues Additional values for multi-value hooks (optional)
   */
  labelState: (label: string, index: number, value: unknown, ...additionalValues: unknown[]) => void;
}

/**
 * Stored log entry for a component
 */
export interface ComponentLogEntry {
  message: string;
  args: unknown[];
  timestamp: number;
}
