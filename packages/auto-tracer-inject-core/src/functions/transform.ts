import { parse } from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type {
  TransformResult,
  TransformContext,
  ComponentInfo,
} from "../interfaces/types.js";
import {
  isComponentFunction,
  extractComponentInfo,
  hasExistingUseAutoTracerImport,
} from "./detect.js";

// Fix for Babel traverse and generate default export issues
const traverseDefault =
  typeof traverse === "function" ? traverse : (traverse as any).default;
const generateDefault =
  typeof generate === "function" ? generate : (generate as any).default;

/**
 * Transforms React component code to inject auto-tracing functionality.
 *
 * This function parses the provided TypeScript/JSX code, identifies React components,
 * and injects `useAutoTracer` hooks along with `labelState` calls for configured hooks.
 * The transformation enables automatic tracking of component renders and state changes.
 *
 * @param code - The source code to transform
 * @param context - Transformation context containing filename and configuration
 * @returns The transformed code with injected tracing, or original code on error
 *
 * @example
 * ```typescript
 * const result = transform(`
 *   function MyComponent() {
 *     const [count, setCount] = useState(0);
 *     return <div>{count}</div>;
 *   }
 * `, {
 *   filename: 'MyComponent.tsx',
 *   config: {
 *     mode: 'opt-out',
 *     labelHooks: ['useState'],
 *     importSource: 'auto-tracer'
 *   }
 * });
 * // Result includes injected useAutoTracer and labelState calls
 * ```
 */
export function transform(
  code: string,
  context: TransformContext
): TransformResult {
  const { filename, config } = context;
  const hookNameSet = new Set(
    (config.labelHooks || []).map((s) => s.trim()).filter(Boolean)
  );
  const hookNameRegex = config.labelHooksPattern
    ? new RegExp(config.labelHooksPattern)
    : null;

  try {
    // Parse the code
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const components: ComponentInfo[] = [];
    let hasInjected = false;
    let needsImport = false;

    // Check if file has pragma controls
    // Precedence rules (mirrors TSDoc and README):
    // - File-level exclude is ultimate: excluded files are never processed
    // - In opt-in mode, files must still match `include`; pragmas do not bypass include
    // - A disable pragma wins over enable when both apply
    // - Component-level pragma overrides file-level for that component
    const hasTracerPragma = hasPragma(code, "@trace");
    const hasDisablePragma = hasPragma(code, "@trace-disable");

    // Skip if disabled or doesn't match mode requirements
    if (hasDisablePragma) {
      return { code, injected: false, components: [] };
    }

    if (config.mode === "opt-in" && !hasTracerPragma) {
      return { code, injected: false, components: [] };
    }

    // Check if import already exists
    const hasImport = hasExistingUseAutoTracerImport(
      ast,
      config.importSource || "auto-tracer"
    );

    // Traverse and transform
    traverseDefault(ast, {
      FunctionDeclaration(path: any) {
        if (isComponentFunction(path.node)) {
          const componentInfo = extractComponentInfo(path.node);
          if (componentInfo) {
            components.push(componentInfo);
            injectUseAutoTracer(
              path,
              componentInfo.name,
              hookNameSet,
              hookNameRegex
            );
            hasInjected = true;
            if (!hasImport) needsImport = true;
          }
        }
      },
      VariableDeclarator(path: any) {
        if (isComponentFunction(path.node)) {
          const componentInfo = extractComponentInfo(path.node);
          if (componentInfo && path.node.init && t.isFunction(path.node.init)) {
            components.push(componentInfo);
            injectUseAutoTracerIntoFunction(
              path.node.init,
              componentInfo.name,
              hookNameSet,
              hookNameRegex
            );
            hasInjected = true;
            if (!hasImport) needsImport = true;
          }
        } else {
          // Handle HOC-wrapped components: const Name = memo(forwardRef(fn)) or similar
          const node = path.node as t.VariableDeclarator;
          if (
            t.isIdentifier(node.id) &&
            node.init &&
            t.isCallExpression(node.init)
          ) {
            const innerFn = unwrapFunctionFromHOCs(node.init, 0);
            if (innerFn) {
              const name = node.id.name;
              components.push({ name, isAnonymous: false, node: innerFn });
              injectUseAutoTracerIntoFunction(
                innerFn,
                name,
                hookNameSet,
                hookNameRegex
              );
              hasInjected = true;
              if (!hasImport) needsImport = true;
            }
          }
        }
      },
    });

    // Add import if needed
    if (needsImport && hasInjected) {
      addUseAutoTracerImport(ast, config.importSource || "auto-tracer");
    }

    // Generate transformed code
    const result = generateDefault(ast, {
      retainLines: true,
      comments: true,
    });

    return {
      code: result.code,
      map: result.map,
      injected: hasInjected,
      components,
    };
  } catch (error) {
    // Return original code on parse/transform errors
    console.warn(`Auto-trace transform failed for ${filename}:`, error);
    return { code, injected: false, components: [] };
  }
}

// Try to unwrap nested HOC calls up to depth 2-3 to find an inner function expression
/**
 * Attempts to unwrap nested Higher-Order Component (HOC) calls to find the inner function.
 *
 * This function recursively traverses HOC call expressions (like `memo()`, `forwardRef()`, etc.)
 * to extract the actual function component that should be transformed. It handles common
 * patterns like `memo(Component)`, `forwardRef(Component)`, and nested combinations.
 *
 * @param expr - The expression to unwrap (typically a call expression)
 * @param depth - Current recursion depth to prevent infinite loops
 * @returns The unwrapped function expression, or null if not found or depth exceeded
 *
 * @example
 * ```typescript
 * // Input: memo(forwardRef(function MyComponent() { ... }))
 * // Output: function MyComponent() { ... }
 * ```
 *
 * @internal
 */
function unwrapFunctionFromHOCs(
  expr: t.Expression,
  depth: number
): t.Function | null {
  if (depth > 3) return null;
  if (t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) {
    return expr;
  }
  if (t.isCallExpression(expr)) {
    // Common shape: memo(fn), forwardRef(fn), HOC(fn), memo(forwardRef(fn))
    const args = expr.arguments;
    for (const arg of args) {
      if (t.isExpression(arg)) {
        const found = unwrapFunctionFromHOCs(arg, depth + 1);
        if (found) return found;
      }
    }
  }
  return null;
}

function hasPragma(code: string, pragma: string): boolean {
  return code.includes(`// ${pragma}`);
}

/**
 * Initiates injection of auto-tracing logic into a React component function.
 *
 * This function serves as the entry point for injecting tracing into a component
 * by delegating to the appropriate injection method based on the function type.
 *
 * @param path - Babel NodePath for the function declaration
 * @param componentName - Name of the React component
 * @param hookNameSet - Set of hook names to label
 * @param hookNameRegex - Regex pattern for hook names to label
 *
 * @internal
 */
function injectUseAutoTracer(
  path: any,
  componentName: string,
  hookNameSet: Set<string>,
  hookNameRegex: RegExp | null
) {
  const func = path.node;
  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatementDirect(
      func.body,
      componentName,
      hookNameSet,
      hookNameRegex
    );
  }
}

function injectUseAutoTracerIntoFunction(
  func: t.Function,
  componentName: string,
  hookNameSet: Set<string>,
  hookNameRegex: RegExp | null
) {
  // Convert arrow function expression body to block if needed
  if (t.isArrowFunctionExpression(func) && !t.isBlockStatement(func.body)) {
    const returnStatement = t.returnStatement(func.body);
    func.body = t.blockStatement([returnStatement]);
  }

  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatementDirect(
      func.body,
      componentName,
      hookNameSet,
      hookNameRegex
    );
  }
}

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
function injectIntoBlockStatementDirect(
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
function addUseAutoTracerImport(ast: t.File, importSource: string) {
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
