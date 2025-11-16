import { componentLogRegistry } from "../../../componentLogRegistry.js";
import type { ComponentLogEntry } from "../../../../interfaces/ComponentLogger.js";

/**
 * Consume component logs for a tracked component by GUID. Pure from caller's
 * perspective but mutates the log registry (by design) to mark logs consumed.
 *
 * @param trackingGUID - Tracking GUID if the component is tracked
 * @returns Array of log entries for the component (may be empty)
 */
export function consumeComponentLogs(
  trackingGUID: string | null
): ComponentLogEntry[] {
  return trackingGUID ? componentLogRegistry.consumeLogs(trackingGUID) : [];
}
