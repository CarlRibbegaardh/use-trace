import { safeGroup } from "../../consoleUtils.js";

/**
 * Internal helper: creates console group with CSS style if provided, otherwise plain text.
 *
 * @param prefix - Monochrome prefix text
 * @param content - Styled content text
 * @param style - CSS style string
 */
export function groupWithOptionalStyle(
  prefix: string,
  content: string,
  style: string
): void {
  if (style && style.length > 0) {
    safeGroup(`${prefix}%c${content}`, style);
  } else {
    safeGroup(`${prefix}${content}`);
  }
}
