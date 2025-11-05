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
   * **Internal API - Not intended for direct developer use**
   *
   * Associates a human-readable label with a state hook for debugging purposes.
   * This method is primarily used by the auto-tracer Vite plugin during build-time
   * AST transformation to automatically label useState/useSelector hooks.
   *
   * While always available at runtime, developers should generally not call this
   * method directly as the Vite plugin handles labeling automatically.
   *
   * @param label Human-readable name for the state hook (e.g., "filteredTodos", "loading")
   * @param index Optional stable index of the state hook within the component (0-based)
   *
   * @example
   * ```tsx
   * // Automatically handled by Vite plugin:
   * const todos = useSelector(selectTodos);
   * // Plugin injects: logger.labelState("todos");
   *
   * // Manual usage (not recommended):
   * const [count, setCount] = useState(0);
   * logger.labelState("count");
   * ```
   */
  labelState: (label: string, index?: number) => void;
}

/**
 * Stored log entry for a component
 */
export interface ComponentLogEntry {
  message: string;
  args: unknown[];
  timestamp: number;
}
