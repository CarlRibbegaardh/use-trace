/**
 * Checks whether the source code contains a specific pragma comment.
 *
 * The check is a simple substring search like `// @trace` or `// @trace-disable`.
 *
 * @param code - Full source code text
 * @param pragma - Pragma token including the leading `@` (e.g. "@trace")
 * @returns True if the pragma comment is present, otherwise false
 *
 * @public
 */
export function hasPragma(code: string, pragma: string): boolean {
  return code.includes(`// ${pragma}`);
}
