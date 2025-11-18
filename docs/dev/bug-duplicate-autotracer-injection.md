# Bug: Duplicate `useAutoTracer` Injection (__autoTracer2)

## Problem Description

In some situations, the Vite/Babel plugin injects a second `useAutoTracer` call:

```typescript
const __autoTracer2 = useAutoTracer();
```

This seems to happen with `console.log` statements that are **not at the top level** of a component.

## Root Cause Analysis

### Current Injection Flow

1. **Main Transform** (`transform.ts`):
   - Traverses AST looking for React components (PascalCase functions returning JSX)
   - Calls `injectUseAutoTracer` or `injectUseAutoTracerIntoFunction` for each component

2. **Block Statement Injection** (`injectIntoBlockStatementDirect.ts`):
   - Injects `useAutoTracer()` if not present
   - Labels hooks (`useState`, etc.)
   - **Recursively** traverses nested blocks looking for `console.log/warn/error`
   - Injects `__autoTracer.log/warn/error()` calls

### The Problem

The recursive traversal in `injectConsoleLoggersInNestedBlocks` (lines 418-429) processes:
- Function declarations inside components
- Arrow functions assigned to variables
- Function expressions

**These nested functions are event handlers or helper functions, NOT React components.**

However, if the main Babel transform (`transform.ts`) is **also** detecting these nested functions as components (due to PascalCase naming or other heuristics), it might be trying to inject a second `useAutoTracer` into them.

### Scenario Where This Happens

```typescript
function MyComponent() {
  const [count, setCount] = useState(0);

  // Nested function - NOT a React component
  function HandleClick() {  // ⚠️ PascalCase name!
    console.log("Button clicked", count);
  }

  return <div onClick={HandleClick}>Click me</div>;
}
```

If `HandleClick` is PascalCase and contains JSX-like patterns, `isComponentFunction` might incorrectly identify it as a component.

## Investigation Steps

1. **Check if nested PascalCase functions are being detected as components**
   - Look at `isComponentFunction.ts` logic
   - Check `returnsJSX` helper

2. **Verify the traversal scope**
   - Ensure `transform.ts` only traverses top-level or exported functions
   - Nested functions should be skipped

3. **Check for scope isolation issues**
   - The recursive `injectConsoleLoggersInNestedBlocks` correctly uses the parent's `finalTracerId`
   - But if a separate traversal is happening, it might create its own tracker

## Expected Behavior

- ✅ Top-level React components get ONE `useAutoTracer`
- ✅ Nested functions use the parent component's `__autoTracer` for logging
- ✅ Nested functions do NOT get their own `useAutoTracer`
- ✅ Only React components (not event handlers) should be detected

## Test Cases Needed

### 1. Nested PascalCase Function with Console Logging

```typescript
function MyComponent() {
  const [count, setCount] = useState(0);

  function HandleClick() {  // PascalCase but NOT a component
    console.log("Clicked", count);
  }

  return <div onClick={HandleClick}>Count: {count}</div>;
}
```

**Expected Output:**
- One `const __autoTracer = useAutoTracer(...)`
- One `__autoTracer.labelState(...)`
- One `__autoTracer.log("Clicked", count)` inside `HandleClick`
- NO `__autoTracer2`

### 2. Nested Function Returning JSX (Still Not a Component)

```typescript
function ParentComponent() {
  const [state, setState] = useState(false);

  function RenderHelper() {  // Returns JSX but not a component
    console.log("Rendering helper");
    return <div>Helper</div>;
  }

  return <div>{RenderHelper()}</div>;
}
```

**Expected Output:**
- This is trickier - if `RenderHelper` returns JSX, it might be detected as a component
- Should check parent scope - nested functions should NOT be treated as components

### 3. Arrow Function Event Handler

```typescript
function TodoList() {
  const [items, setItems] = useState([]);

  const handleAdd = () => {
    console.log("Adding item");
    setItems([...items, "new"]);
  };

  return <button onClick={handleAdd}>Add</button>;
}
```

**Expected Output:**
- One `const __autoTracer = useAutoTracer(...)`
- One `__autoTracer.log("Adding item")` inside `handleAdd`
- NO second `useAutoTracer`

## Potential Fix

### Option 1: Add Scope Checking to `isComponentFunction`

Only detect functions as components if they are:
- Top-level in the file
- Exported
- NOT nested inside another function

### Option 2: Track Traversal Depth

```typescript
// In transform.ts
traverseDefault(ast, {
  FunctionDeclaration(path: any) {
    // Only process if parent is Program or ExportDeclaration
    const parent = path.parent;
    if (!t.isProgram(parent) && !t.isExportDeclaration(parent)) {
      return; // Skip nested functions
    }

    if (isComponentFunction(path.node)) {
      // ... inject
    }
  },
  // Same for VariableDeclarator
});
```

### Option 3: Add Depth Parameter to Injection Functions

Track whether we're already inside a component to prevent double injection.

## Priority

**HIGH** - This creates invalid code and confuses the tracer system.

## Next Steps

1. Create failing test for each scenario above
2. Add debug logging to see what's being detected as a component
3. Implement scope checking in component detection
4. Verify fix doesn't break existing tests
