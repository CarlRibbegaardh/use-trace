import * as t from "@babel/types";

/**
 * Adds an import statement for useAutoTracer to the top of the AST file.
 *
 * This function creates and prepends an ES6 import statement for the useAutoTracer
 * hook from the configured import source. The import is added at the beginning
 * of the program body to ensure it's available for injected code.
 *
 * @param ast - The Babel AST file to modify
 * @param importSource - The module path to import useAutoTracer from
 *
 * @example
 * ```typescript
 * // Before: empty file
 * // After: import { useAutoTracer } from 'auto-tracer';
 * ```
 *
 * @internal
 */
export function addUseAutoTracerImport(ast: t.File, importSource: string) {
  const importDeclaration = t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier("useAutoTracer"),
        t.identifier("useAutoTracer")
      ),
    ],
    t.stringLiteral(importSource)
  );

  ast.program.body.unshift(importDeclaration);
}
