/**
 * Logger interface for useAutoTrace components
 */
export interface ComponentLogger {
  /**
   * Log a message that will be displayed when the component is rendered by autoTrace
   * @param message The message to log
   * @param args Additional arguments (similar to console.log)
   */
  log: (message: string, ...args: unknown[]) => void;
}

/**
 * Stored log entry for a component
 */
export interface ComponentLogEntry {
  message: string;
  args: unknown[];
  timestamp: number;
}
