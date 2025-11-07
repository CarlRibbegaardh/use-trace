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

  // First pass: compute source-order indices for ALL React hook calls (including nested)
  const callToIndex = new WeakMap<t.CallExpression, number>();
  const isReactHookCallee = (node: t.Node | null | undefined): node is t.Identifier => {
    return !!node && t.isIdentifier(node) && /^use[A-Z]/.test(node.name) && node.name !== "useAutoTracer";
  };

  function collectHookCalls(node: t.Node | null | undefined, push: (call: t.CallExpression) => void): void {
    if (!node) return;
    if (t.isCallExpression(node)) {
      if (isReactHookCallee(node.callee)) {
        push(node);
      }
      // Recurse into arguments to find nested hook calls
      for (const arg of node.arguments) {
        if (t.isExpression(arg)) {
          collectHookCalls(arg, push);
        } else if (t.isSpreadElement(arg)) {
          collectHookCalls(arg.argument as t.Node, push);
        }
      }
      return;
    }

    // Handle a few common expression/container node kinds that can contain calls
    if (t.isArrayExpression(node)) {
      for (const elem of node.elements) {
        if (t.isExpression(elem)) collectHookCalls(elem, push);
      }
      return;
    }
    if (t.isObjectExpression(node)) {
      for (const prop of node.properties) {
        if (t.isObjectProperty(prop)) {
          collectHookCalls(prop.value as t.Node, push);
        } else if (t.isSpreadElement(prop)) {
          collectHookCalls(prop.argument as t.Node, push);
        }
      }
      return;
    }
    if (t.isConditionalExpression(node)) {
      collectHookCalls(node.test, push);
      collectHookCalls(node.consequent, push);
      collectHookCalls(node.alternate, push);
      return;
    }
    if (t.isSequenceExpression(node)) {
      for (const expr of node.expressions) collectHookCalls(expr, push);
      return;
    }
    if (t.isLogicalExpression(node)) {
      collectHookCalls(node.left, push);
      collectHookCalls(node.right, push);
      return;
    }
    if (t.isUnaryExpression(node) || t.isUpdateExpression(node)) {
      collectHookCalls((node as t.UnaryExpression | t.UpdateExpression).argument as t.Node, push);
      return;
    }
    if (t.isBinaryExpression(node)) {
      collectHookCalls(node.left as t.Node, push);
      collectHookCalls(node.right as t.Node, push);
      return;
    }
    if (t.isMemberExpression(node)) {
      collectHookCalls(node.object as t.Node, push);
      collectHookCalls(node.property as t.Node, push);
      return;
    }
    // Other node kinds are unlikely to contain top-level hook calls relevant here
  }

  const orderedCalls: t.CallExpression[] = [];
  for (let i = 0; i < blockStatement.body.length; i++) {
    const stmt = blockStatement.body[i];
    if (t.isVariableDeclaration(stmt)) {
      for (const decl of stmt.declarations) {
        collectHookCalls(decl.init as t.Node | undefined, (call) => orderedCalls.push(call));
      }
    } else if (t.isExpressionStatement(stmt)) {
      collectHookCalls(stmt.expression, (call) => orderedCalls.push(call));
    }
  }
  // Assign indices in source order
  let positionCounter = 0;
  for (const call of orderedCalls) {
    if (!callToIndex.has(call)) {
      callToIndex.set(call, positionCounter++);
    }
  }

  // Second pass: identify labeled hooks and use the precomputed index
  const hooksToLabel: Array<{ index: number; label: string; hookPosition: number }> = [];
  for (let i = 0; i < blockStatement.body.length; i++) {
    const stmt = blockStatement.body[i];

    if (t.isVariableDeclaration(stmt) && stmt.declarations.length === 1) {
      const decl = stmt.declarations[0];
      const init = decl.init;
      if (!init || !t.isCallExpression(init)) continue;

      const callee = init.callee;
      if (!t.isIdentifier(callee)) continue;

      const hookName = callee.name;

      if (hookName === "useAutoTracer") continue;

      const isReactHook = /^use[A-Z]/.test(hookName);
      if (!isReactHook) continue;

      const hookPosition = callToIndex.get(init);
      if (hookPosition === undefined) continue;

      const isKnownStateHook = hookName === "useState" || hookName === "useReducer";
      const isConfiguredHook = hookNameSet.has(hookName) || (hookNameRegex && hookNameRegex.test(hookName));

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
        hooksToLabel.push({ index: i, label, hookPosition });
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
    const { index, label, hookPosition } = hooksToLabel[i];
    const labelStateCall = t.expressionStatement(
      t.callExpression(
        t.memberExpression(tracerId, t.identifier("labelState")),
        [t.stringLiteral(label), t.numericLiteral(hookPosition)]
      )
    );
    blockStatement.body.splice(index + 1, 0, labelStateCall);
  }
}
