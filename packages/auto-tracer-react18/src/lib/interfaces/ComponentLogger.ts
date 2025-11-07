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
   * NOTE: The index is REQUIRED. Manual use without the injector is unsupported.
   *
   * @param label Human-readable name for the state hook (e.g., "filteredTodos", "loading")
   * @param index Stable index of the state hook within the component (0-based)
   */
  labelState: (label: string, index: number) => void;
}

/**
 * Stored log entry for a component
 */
export interface ComponentLogEntry {
  message: string;
  args: unknown[];
  timestamp: number;
}
