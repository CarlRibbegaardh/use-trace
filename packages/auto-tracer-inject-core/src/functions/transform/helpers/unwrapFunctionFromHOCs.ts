import * as t from "@babel/types";

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
export function unwrapFunctionFromHOCs(
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
