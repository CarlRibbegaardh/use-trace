## Auto-Injection Demo

This app demonstrates the auto-injection of `useAutoTracer` into React components.

### Setup Requirements:

1. **AutoTracer Initialization** (`src/main.tsx`) - The `autoTracer()` call must be made before rendering any components:

   ```typescript
   import { autoTracer } from "use-trace";

   autoTracer({
     enabled: true,
     showFlags: true,
     // ... other config options
   });
   ```

2. **Vite Plugin Configuration** - The auto-injection plugin runs during development builds only

### Components with auto-injection:

**Mode: `opt-out`** - All components get `useAutoTracer()` injected automatically, except:

- Components with `// @trace-disable` pragma (none in this demo)
- Files matching exclude patterns (test files)

**Components being auto-injected:**

1. **TodoItem** (`src/components/TodoItem.tsx`) - Has `// @trace` pragma (redundant in opt-out mode)
2. **TestComponent** (`src/components/TestComponent.tsx`) - Has `// @trace` pragma (redundant in opt-out mode)
3. **TodoList** (`src/components/TodoList.tsx`) - No pragma needed in opt-out mode
4. **AddTodoForm** (`src/components/AddTodoForm.tsx`) - No pragma needed in opt-out mode
5. **App component** and other components without disable pragmas

**Not injectable:**

- `main.tsx` - Entry point file, contains the autoTracer setup call instead

### How it works:

1. The Vite plugin runs **before** React transformations (`enforce: 'pre'`)
2. Components are detected via AST analysis (PascalCase + JSX return)
3. `useAutoTracer()` calls are automatically injected as the first statement
4. Import statements are automatically added when needed
5. Only runs in development mode - production builds are unaffected

### Verification:

1. Open browser dev tools (http://localhost:5174)
2. Check the Console for auto-trace logs when components render/update
3. Interact with the todo app to see component traces
4. In Sources tab, you can see the transformed code with injected `useAutoTracer()` calls

### Configuration:

```typescript
// vite.config.ts
autoTracer.vite({
  mode: "opt-out", // Inject by default (opposite of 'opt-in')
  importSource: "use-trace", // Import useAutoTracer from this package
  include: ["src/**/*.tsx"], // Include these file patterns
  exclude: ["**/*.test.*"], // Exclude test files
});
```
