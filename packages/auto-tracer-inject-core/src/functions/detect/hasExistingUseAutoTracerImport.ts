import * as t from "@babel/types";

/**
 * hasExistingUseAutoTracerImport
 *
 * Returns true if the given program AST already has a named import for
 * `useAutoTracer` from the specified import source.
 */
export function hasExistingUseAutoTracerImport(
  ast: t.File,
  importSource: string
): boolean {
  for (const stmt of ast.program.body) {
    if (t.isImportDeclaration(stmt) && stmt.source.value === importSource) {
      return stmt.specifiers.some(
        (
          spec:
            | t.ImportSpecifier
            | t.ImportDefaultSpecifier
            | t.ImportNamespaceSpecifier
        ) =>
          t.isImportSpecifier(spec) &&
          t.isIdentifier(spec.imported) &&
          spec.imported.name === "useAutoTracer"
      );
    }
  }
  return false;
}
