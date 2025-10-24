import type { ComponentLogEntry } from "../interfaces/ComponentLogger.js";

/**
 * Registry for storing component logs until they are displayed by autoTrace
 */
class ComponentLogRegistry {
  private logs = new Map<string, ComponentLogEntry[]>();

  /**
   * Add a log entry for a component GUID
   */
  addLog(guid: string, message: string, ...args: unknown[]): void {
    if (!this.logs.has(guid)) {
      this.logs.set(guid, []);
    }

    this.logs.get(guid)!.push({
      message,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Get and consume all logs for a component GUID
   * This removes the logs from the registry after returning them
   */
  consumeLogs(guid: string): ComponentLogEntry[] {
    const logs = this.logs.get(guid) || [];
    this.logs.delete(guid);
    return logs;
  }

  /**
   * Clear all logs (useful for cleanup)
   */
  clear(): void {
    this.logs.clear();
  }

  /**
   * Get the number of stored log entries across all components
   */
  getLogCount(): number {
    let count = 0;
    for (const logs of this.logs.values()) {
      count += logs.length;
    }
    return count;
  }
}

// Global registry instance
export const componentLogRegistry = new ComponentLogRegistry();
