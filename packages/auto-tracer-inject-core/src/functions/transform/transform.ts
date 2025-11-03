import { parse } from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { TransformContext } from "../../interfaces/TransformContext.js";
import type { TransformResult } from "../../interfaces/TransformResult.js";
import type { ComponentInfo } from "../../interfaces/ComponentInfo.js";
import { isComponentFunction } from "../detect/isComponentFunction.js";
import { extractComponentInfo } from "../detect/extractComponentInfo.js";
import { hasExistingUseAutoTracerImport } from "../detect/hasExistingUseAutoTracerImport.js";
import { hasPragma } from "./helpers/hasPragma.js";
import { unwrapFunctionFromHOCs } from "./helpers/unwrapFunctionFromHOCs.js";
import { injectUseAutoTracer } from "./helpers/injectUseAutoTracer.js";
import { injectUseAutoTracerIntoFunction } from "./helpers/injectUseAutoTracerIntoFunction.js";
import { addUseAutoTracerImport } from "./helpers/addUseAutoTracerImport.js";

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
  const { config } = context;
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
    // console.warn(`Auto-trace transform failed for ${filename}:`, error);
    return { code, injected: false, components: [] };
  }
}
