/**
 * isPascalCase
 *
 * Returns true if the provided identifier name is PascalCase.
 */
export function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}
