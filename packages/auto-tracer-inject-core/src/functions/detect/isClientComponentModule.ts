import type { File } from '@babel/types';

/**
 * Checks if a Babel AST has a "use client" directive.
 * This is used to identify React Client Component modules.
 *
 * @param ast - The Babel AST of the file.
 * @returns True if the "use client" directive is present, false otherwise.
 */
export function isClientComponentModule(ast: File): boolean {
  return ast.program.directives.some(
    (directive) => directive.value.value === 'use client',
  );
}
