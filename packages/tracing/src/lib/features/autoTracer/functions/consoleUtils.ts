/**
 * Console utilities with safe error handling
 * Provides safe wrappers for console methods that handle environments where console might not be available
 */

/**
 * Safe console.log wrapper
 * Safely handles environments where console might not be available
 */
export function safeLog(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.log) {
      console.log(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.group wrapper
 */
export function safeGroup(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.group) {
      console.group(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.groupEnd wrapper
 */
export function safeGroupEnd(): void {
  try {
    if (typeof console !== "undefined" && console.groupEnd) {
      console.groupEnd();
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.warn wrapper
 */
export function safeWarn(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.error wrapper
 */
export function safeError(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}
