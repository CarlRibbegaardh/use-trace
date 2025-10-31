import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { TransformResult, TransformContext, ComponentInfo } from './types.js';
import { isComponentFunction, extractComponentInfo, hasExistingUseAutoTracerImport } from './detect.js';

// Fix for Babel traverse and generate default export issues
const traverseDefault = typeof traverse === 'function' ? traverse : (traverse as any).default;
const generateDefault = typeof generate === 'function' ? generate : (generate as any).default;

export function transform(code: string, context: TransformContext): TransformResult {
  const { filename, config } = context;

  try {
    // Parse the code
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const components: ComponentInfo[] = [];
    let hasInjected = false;
    let needsImport = false;

    // Check if file has pragma controls
    const hasTracerPragma = hasPragma(code, '@trace');
    const hasDisablePragma = hasPragma(code, '@trace-disable');

    // Skip if disabled or doesn't match mode requirements
    if (hasDisablePragma) {
      return { code, injected: false, components: [] };
    }

    if (config.mode === 'opt-in' && !hasTracerPragma) {
      return { code, injected: false, components: [] };
    }

    // Check if import already exists
    const hasImport = hasExistingUseAutoTracerImport(ast, config.importSource || 'use-trace');

    // Traverse and transform
    traverseDefault(ast, {
      FunctionDeclaration(path: any) {
        if (isComponentFunction(path.node)) {
          const componentInfo = extractComponentInfo(path.node);
          if (componentInfo) {
            components.push(componentInfo);
            injectUseAutoTracer(path, componentInfo.name);
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
            injectUseAutoTracerIntoFunction(path.node.init, componentInfo.name);
            hasInjected = true;
            if (!hasImport) needsImport = true;
          }
        }
      }
    });

    // Add import if needed
    if (needsImport && hasInjected) {
      addUseAutoTracerImport(ast, config.importSource || 'use-trace');
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
      components
    };

  } catch (error) {
    // Return original code on parse/transform errors
    console.warn(`Auto-trace transform failed for ${filename}:`, error);
    return { code, injected: false, components: [] };
  }
}

function hasPragma(code: string, pragma: string): boolean {
  return code.includes(`// ${pragma}`);
}

function injectUseAutoTracer(path: any, componentName: string) {
  const func = path.node;
  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatement(func.body, componentName);
  }
}

function injectUseAutoTracerIntoFunction(func: t.Function, componentName: string) {
  // Convert arrow function expression body to block if needed
  if (t.isArrowFunctionExpression(func) && !t.isBlockStatement(func.body)) {
    const returnStatement = t.returnStatement(func.body);
    func.body = t.blockStatement([returnStatement]);
  }

  if (t.isBlockStatement(func.body)) {
    injectIntoBlockStatement(func.body, componentName);
  }
}

function injectIntoBlockStatement(blockStatement: t.BlockStatement, componentName: string) {
  const useAutoTracerCall = t.expressionStatement(
    t.callExpression(
      t.identifier('useAutoTracer'),
      [t.objectExpression([
        t.objectProperty(t.identifier('name'), t.stringLiteral(componentName))
      ])]
    )
  );

  blockStatement.body.unshift(useAutoTracerCall);
}

function addUseAutoTracerImport(ast: t.File, importSource: string) {
  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier('useAutoTracer'), t.identifier('useAutoTracer'))],
    t.stringLiteral(importSource)
  );

  ast.program.body.unshift(importDeclaration);
}
