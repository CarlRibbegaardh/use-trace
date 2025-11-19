import { safeLog } from "../../consoleUtils.js";

/**
 * Internal helper: logs with CSS style if provided, otherwise logs plain text.
 *
 * @param prefix - Monochrome prefix text
 * @param content - Styled content text
 * @param style - CSS style string
 * @param args - Additional arguments to pass to console.log
 */
export function logWithOptionalStyle(
  prefix: string,
  content: string,
  style: string,
  ...args: unknown[]
): void {
  if (style && style.length > 0) {
    safeLog(`${prefix}%c${content}`, style, ...args);
  } else {
    safeLog(`${prefix}${content}`, ...args);
  }
}
