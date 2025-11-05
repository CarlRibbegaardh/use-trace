import * as t from "@babel/types";

/**
 * Injects auto-tracing logic into a React component's block statement using plain AST manipulation.
 *
 * This function scans the component body for hook declarations and injects
 * `labelState` calls immediately after each matching hook. It also ensures
 * a `useAutoTracer` hook is available for state labeling.
 *
 * @param blockStatement - Babel BlockStatement AST node to modify
 * @param componentName - Name of the React component being transformed
 * @param hookNameSet - Set of hook names that should be labeled (from labelHooks config)
 * @param hookNameRegex - Regular expression for matching hook names (from labelHooksPattern config)
 *
 * @internal
 */
export function injectIntoBlockStatementDirect(
  blockStatement: t.BlockStatement,
  componentName: string,
  hookNameSet: Set<string>,
  hookNameRegex: RegExp | null
) {
  // Determine if there's a pre-existing tracer variable assignment, or a bare call
  let existingTracerIdentifier: t.Identifier | null = null;
  let hasBareUseAutoTracerCall = false;

  for (const stmt of blockStatement.body) {
    if (t.isVariableDeclaration(stmt)) {
      for (const decl of stmt.declarations) {
        if (decl.init && t.isCallExpression(decl.init)) {
          const callee = decl.init.callee;
          if (t.isIdentifier(callee, { name: "useAutoTracer" })) {
            if (t.isIdentifier(decl.id)) {
              existingTracerIdentifier = decl.id;
            }
          }
        }
      }
    } else if (
      t.isExpressionStatement(stmt) &&
      t.isCallExpression(stmt.expression)
    ) {
      const callee = stmt.expression.callee;
      if (t.isIdentifier(callee, { name: "useAutoTracer" })) {
        hasBareUseAutoTracerCall = true;
      }
    }
  }

  // If any manual labelState calls already exist in this block, skip injecting labels to avoid duplicates
  const hasExistingLabelStateCalls = blockStatement.body.some((stmt) => {
    if (!t.isExpressionStatement(stmt)) return false;
    const expr = stmt.expression;
    if (!t.isCallExpression(expr)) return false;
    const callee = expr.callee;
    return (
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property, { name: "labelState" })) ||
      (t.isOptionalMemberExpression(callee) &&
        t.isIdentifier(callee.property, { name: "labelState" }))
    );
  });

  // If we have a bare call (no identifier), we cannot safely inject labels without adding a new hook. Bail out.
  if (hasBareUseAutoTracerCall && !existingTracerIdentifier) {
    return;
  }

  // Resolve tracer identifier (will inject later)
  let tracerId = existingTracerIdentifier;

  // If labels already exist, do not inject duplicates
  if (hasExistingLabelStateCalls) {
    return;
  }

  // First pass: scan for hooks to label
  const hooksToLabel: Array<{ index: number; label: string }> = [];

  // Iterate over the body statements
  for (let i = 0; i < blockStatement.body.length; i++) {
    const stmt = blockStatement.body[i];

    if (t.isVariableDeclaration(stmt) && stmt.declarations.length === 1) {
      const decl = stmt.declarations[0];
      const init = decl.init;
      if (!init || !t.isCallExpression(init)) continue;

      const callee = init.callee;
      if (!t.isIdentifier(callee)) continue;

      const hookName = callee.name;
      const isKnownStateHook =
        hookName === "useState" || hookName === "useReducer";
      const isConfiguredHook =
        hookNameSet.has(hookName) ||
        (hookNameRegex && hookNameRegex.test(hookName));

      // Skip useAutoTracer - it's the tracer hook itself
      if (hookName === "useAutoTracer") continue;

      if (!isKnownStateHook && !isConfiguredHook) continue;

      let label: string | null = null;

      // Pattern A: const [name] = useState(...)
      if (t.isArrayPattern(decl.id) && decl.id.elements.length > 0) {
        const firstElement = decl.id.elements[0];
        if (t.isIdentifier(firstElement)) {
          label = firstElement.name;
        }
      }
      // Pattern B: const name = useSelector(...)
      else if (t.isIdentifier(decl.id) && isConfiguredHook) {
        label = decl.id.name;
      }

      if (label) {
        hooksToLabel.push({ index: i, label });
      }
    }
  }

  // If no hooks to label, nothing to do
  if (hooksToLabel.length === 0) {
    return;
  }

  // Resolve tracer identifier, injecting one if not present
  if (!tracerId) {
    tracerId = t.identifier("__autoTracer");
    const useAutoTracerInit = t.callExpression(t.identifier("useAutoTracer"), [
      t.objectExpression([
        t.objectProperty(t.identifier("name"), t.stringLiteral(componentName)),
      ]),
    ]);
    const tracerDecl = t.variableDeclaration("const", [
      t.variableDeclarator(tracerId, useAutoTracerInit),
    ]);
    blockStatement.body.unshift(tracerDecl);

    // Adjust indices after prepending tracer declaration
    hooksToLabel.forEach((hook) => hook.index++);
  }

  // Create and insert labelState calls in reverse order to maintain positions
  for (let i = hooksToLabel.length - 1; i >= 0; i--) {
    const { index, label } = hooksToLabel[i];
    const labelStateCall = t.expressionStatement(
      t.callExpression(
        t.memberExpression(tracerId, t.identifier("labelState")),
        [t.stringLiteral(label), t.numericLiteral(i)]
      )
    );
    blockStatement.body.splice(index + 1, 0, labelStateCall);
  }
}
