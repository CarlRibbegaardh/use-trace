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
   * Log a warning message that will be displayed when the component is rendered by autoTracer
   * @param message The warning message to log
   * @param args Additional arguments (similar to console.warn)
   */
  warn: (message: string, ...args: unknown[]) => void;

  /**
   * Log an error message that will be displayed when the component is rendered by autoTracer
   * @param message The error message to log
   * @param args Additional arguments (similar to console.error)
   */
  error: (message: string, ...args: unknown[]) => void;

  /**
   * INTERNAL: Associates human-readable label(s) with a state hook using its stable index
   * in React's _debugHookTypes ordering. Intended for code injection only.
   *
   * NOTE: The index is REQUIRED as the first argument, followed by alternating name-value pairs.
   * Manual use without the injector is unsupported.
   *
   * @param index Stable index of the state hook within the component (0-based)
   * @param nameValuePairs Alternating name-value pairs: "name1", value1, "name2", value2, ...
   */
  labelState: (index: number, ...nameValuePairs: unknown[]) => void;
}

/**
 * Stored log entry for a component
 */
export interface ComponentLogEntry {
  message: string;
  args: unknown[];
  timestamp: number;
  level: 'log' | 'warn' | 'error';
}
