import type { AutoTracerOptions } from "../interfaces/AutoTracerOptions.js";
import { deepMergeOptions } from "../functions/deepMerge.js";
import { defaultAutoTracerOptions } from "./defaultSettings.js";
import { log } from "../functions/log.js";

export let isGlobalTracerInstalled = false;
export let renderStartTime = 0;

// Dark mode detection utility
function isDarkMode(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch (_error) {
    // Return false if media query fails
    return false;
  }
}

// Initialize with default settings
export let traceOptions: AutoTracerOptions = defaultAutoTracerOptions;

// Export dark mode detection for use in other modules
export { isDarkMode };

export function setIsGlobalTracerInstalled(value: boolean): void {
  isGlobalTracerInstalled = value;
}

export function setRenderStartTime(value: number): void {
  renderStartTime = value;
}

export function setTracerOptions(options: AutoTracerOptions): void {
  traceOptions = deepMergeOptions(traceOptions, options);

  // Debug logging to verify options are being applied
  if (options.enableAutoTracerInternalsLogging) {
    log("AutoTracer options updated:", JSON.stringify(options, null, 2));
  }
}
