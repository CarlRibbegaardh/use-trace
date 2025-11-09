# Auto-Tracer for React 18

## Introduction

Auto-Tracer is a development tool that automatically logs React component renders and state changes in your browser console. It works by hooking into React's internal DevTools attachment points to observe the component lifecycle without modifying your application code. When combined with the build-time injection plugin, it can automatically resolve human-readable names for your state variables, making it easy to understand what's happening in your React application.

Unlike traditional debugging approaches that require manual `console.log` statements scattered throughout your code, Auto-Tracer provides a comprehensive, automatic view of your component tree's behavior. You'll see exactly which components rendered, why they rendered, what state changed, and what props changed—all without writing a single debug statement.

## Why Use Auto-Tracer?

React applications can be difficult to debug, especially when dealing with performance issues or unexpected re-renders. Common challenges include:

**Understanding Component Behavior**: When a component renders unexpectedly, it's often unclear which prop or state change triggered it. Auto-Tracer shows you exactly what changed and why.

**Performance Debugging**: Identifying unnecessary re-renders requires careful analysis. Auto-Tracer detects when a component renders with identical data (different reference, same content) and flags these as potential performance issues.

**State Management Complexity**: In applications using Redux, custom hooks, or complex state patterns, tracking which state values changed and when can be overwhelming. Auto-Tracer automatically labels your state variables with meaningful names.

**Learning and Onboarding**: New team members can observe how data flows through the component tree in real-time, making it easier to understand the application architecture.

## How It Works

Auto-Tracer operates on two levels: runtime monitoring and build-time code injection.

### Runtime Monitoring

At runtime, Auto-Tracer uses React's DevTools hook to observe component renders. When React's reconciler processes component updates, Auto-Tracer examines the fiber tree (React's internal representation of your component hierarchy) to extract:

- Which components rendered and in what order
- What state values changed (by comparing current and previous hook states)
- What props changed (by comparing current and previous props)
- Component hierarchy and nesting depth

This information is formatted and logged to the console with visual indentation to show the component tree structure.

### Build-Time Injection

The optional Vite or Babel plugin analyzes your source code at build time to inject automatic state labeling. When it encounters a `useState`, `useReducer`, or configured hook call, it automatically inserts a call to label that state variable:

```typescript
// Your source code:
const [count, setCount] = useState(0);

// After plugin transformation:
const [count, setCount] = useState(0);
__autoTracer.labelState("count", 0, count);
```

This automated labeling means your console logs show "count" instead of "state0" or "unknown", making debugging significantly easier.

## Installation

Install the core tracing library:

```bash
pnpm add -D @auto-tracer/react18
```

For automatic state labeling, also install the build plugin for your toolchain:

```bash
# For Vite projects
pnpm add -D @auto-tracer/plugin-vite-react18

# For Babel projects (Next.js, CRA, etc.)
pnpm add -D @auto-tracer/plugin-babel-react18
```

## Basic Setup

### Initialize Auto-Tracer in Your Application

In your application's entry point (typically `main.tsx` or `index.tsx`), initialize Auto-Tracer before rendering your React application:

```typescript
import { createRoot } from 'react-dom/client';
import { autoTracer } from '@auto-tracer/react18';
import App from './App';

// Initialize Auto-Tracer
autoTracer();

// Render your app
createRoot(document.getElementById('root')!).render(<App />);
```

This basic setup enables automatic component render tracking. You'll immediately see console logs whenever components render.

### Vite Configuration

If you're using Vite and want automatic state labeling, configure the plugin in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoTracerPlugin } from '@auto-tracer/plugin-vite-react18';

export default defineConfig({
  plugins: [
    react(),
    autoTracerPlugin({
      labelHooksPattern: '^use[A-Z].*', // Label all hooks (recommended)
    }),
  ],
});
```

The `labelHooksPattern` uses a regular expression to match hook names. The pattern `'^use[A-Z].*'` matches any function starting with "use" followed by a capital letter, which covers:
- State hooks: `useState`, `useReducer`
- Selector hooks: `useSelector` (Redux), `useParams` (React Router)
- Custom hooks that return state values: `useUser`, `useTodos`, `useAuth`, etc.

The plugin only injects labeling for hooks that return values assigned to variables. Hooks like `useEffect`, `useLayoutEffect`, and `useCallback` that don't assign to variables are automatically skipped.

**Important**: Using the pattern-based approach is recommended because it ensures all your state-returning hooks are tracked and visible in the render logs. If you only specify specific hooks with `labelHooks: ['useState', 'useReducer']`, other hooks like `useSelector` or custom hooks won't be included in the component render tracking.

### Babel Configuration

For Babel-based projects (Next.js, Create React App with ejected config), add the plugin to your Babel configuration:

```javascript
// babel.config.js
module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-typescript'],
  plugins: [
    ['@auto-tracer/plugin-babel-react18', {
      labelHooksPattern: '^use[A-Z].*', // Label all hooks (recommended)
    }],
  ],
};
```

For Next.js specifically:

```javascript
// next.config.js
module.exports = {
  compiler: {
    // Disable SWC to use Babel
    swc: false,
  },
};
```

## Configuration Options

### Runtime Configuration

The `autoTracer()` function accepts an options object to customize its behavior:

```typescript
autoTracer({
  enabled: true,
  logComponentRenders: true,
  logStateChanges: true,
  logPropChanges: true,
  detectIdenticalValueChanges: true,
  componentsToTrace: ['*'],
  componentsToExclude: [],
  statePropsToExclude: ['theme', 'className'],
  maxDepth: undefined,
});
```

#### `enabled`

**Type**: `boolean`
**Default**: `true`

Enables or disables all tracing. When set to `false`, Auto-Tracer has no runtime overhead.

```typescript
autoTracer({
  enabled: process.env.NODE_ENV === 'development',
});
```

#### `logComponentRenders`

**Type**: `boolean`
**Default**: `true`

Controls whether component render events are logged. When enabled, you'll see logs like:

```
[ComponentName] Rendering ⚡
```

Disable this if you only want to see state and prop changes.

#### `logStateChanges`

**Type**: `boolean`
**Default**: `true`

Controls whether state changes are logged. When enabled, you'll see logs like:

```
State change count: 0 → 1
```

Disable this if you only care about which components rendered, not what state changed.

#### `logPropChanges`

**Type**: `boolean`
**Default**: `true`

Controls whether prop changes are logged. When enabled, you'll see logs like:

```
Prop change userId: 123 → 456
```

#### `detectIdenticalValueChanges`

**Type**: `boolean`
**Default**: `true`

When enabled, Auto-Tracer compares the previous and current values using deep equality. If the reference changed but the content is identical, it flags this as a potential performance issue:

```
⚠️ filteredTodos (identical value): [{id: 1}] → [{id: 1}]
```

This helps identify expensive re-renders caused by creating new object references with identical data.

#### `componentsToTrace`

**Type**: `string[]`
**Default**: `['*']`

Specifies which components to trace. Use `['*']` to trace all components, or provide an array of component names:

```typescript
autoTracer({
  componentsToTrace: ['TodoList', 'TodoItem', 'UserProfile'],
});
```

You can use wildcards:

```typescript
autoTracer({
  componentsToTrace: ['Todo*', 'User*'],
});
```

#### `componentsToExclude`

**Type**: `string[]`
**Default**: `[]`

Specifies components to exclude from tracing. Useful for filtering out noisy third-party components:

```typescript
autoTracer({
  componentsToExclude: ['ForwardRef', 'Memo', 'Context.Provider'],
});
```

Wildcards are supported:

```typescript
autoTracer({
  componentsToExclude: ['MuiBox*', 'MuiButton*'],
});
```

#### `statePropsToExclude`

**Type**: `string[]`
**Default**: `[]`

Excludes specific prop or state names from logging. Useful for filtering out verbose or uninteresting props:

```typescript
autoTracer({
  statePropsToExclude: ['className', 'style', 'theme', 'sx'],
});
```

#### `maxDepth`

**Type**: `number | undefined`
**Default**: `undefined`

Limits the depth of component tree traversal. Set to a number to only trace components up to that nesting level:

```typescript
autoTracer({
  maxDepth: 5, // Only trace components nested 5 levels deep or less
});
```

### Build-Time Plugin Configuration

Both the Vite and Babel plugins accept the same configuration options:

```typescript
{
  labelHooksPattern: '^use[A-Z].*',  // Recommended: matches all hooks
  labelHooks: [],                     // Optional: specific hooks to label
  exclude: [],
  include: ['**/*.tsx', '**/*.jsx'],
}
```

#### `labelHooksPattern` (Recommended)

**Type**: `string | undefined`
**Default**: `undefined`

A regular expression pattern to match hook names. **This is the recommended way to configure the plugin** because it ensures all your state-returning hooks are tracked and visible in component render logs.

```typescript
autoTracerPlugin({
  labelHooksPattern: '^use[A-Z].*', // Matches all hooks starting with "use"
})
```

The pattern `'^use[A-Z].*'` matches:
- Standard React state hooks: `useState`, `useReducer`, `useMemo`
- Redux hooks: `useSelector`, `useDispatch`
- React Router hooks: `useNavigate`, `useParams`, `useLocation`
- Custom hooks: `useUser`, `useTodos`, `useAuth`, etc.

The plugin only injects labeling for hooks where the return value is assigned to a variable. Side-effect hooks like `useEffect`, `useLayoutEffect`, or `useImperativeHandle` are automatically skipped because they don't return values to label.

Without this pattern, only hooks explicitly listed in `labelHooks` will be tracked, and components using other hooks won't show complete render information in the console.

#### `labelHooks`

**Type**: `string[]`
**Default**: `[]`

An array of specific hook names to label. Use this if you want fine-grained control over which hooks are labeled, but be aware that **hooks not in this list won't be tracked for render visualization**.

```typescript
autoTracerPlugin({
  labelHooks: ['useState', 'useReducer', 'useSelector'],
})
```

**Important**: If you only specify `labelHooks` without `labelHooksPattern`, components using other hooks (like `useEffect`, custom hooks, etc.) won't have complete render tracking. For most use cases, `labelHooksPattern` is preferred.

You can combine both options:

```typescript
autoTracerPlugin({
  labelHooksPattern: '^use[A-Z].*',  // Label all hooks
  labelHooks: ['useSpecialHook'],     // Plus any that don't match the pattern
})
```

#### `include`

**Type**: `string[]`
**Default**: `['**/*.tsx', '**/*.jsx']`

Glob patterns for files that should be processed by the plugin. Only files matching these patterns will have automatic labeling injected.

```typescript
autoTracerPlugin({
  include: ['src/components/**/*.tsx', 'src/features/**/*.tsx'],
})
```

#### `exclude`

**Type**: `string[]`
**Default**: `[]`

Glob patterns for files that should be excluded from processing. Useful for skipping third-party code or test files:

```typescript
autoTracerPlugin({
  exclude: ['**/*.test.tsx', 'node_modules/**', 'src/lib/**'],
})
```

## Usage Patterns

### Basic Component Tracing

With Auto-Tracer initialized, all component renders are automatically logged:

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Console output when clicking the button:
// [Counter] Rendering ⚡
//   State change count: 0 → 1
```

### Automatic State Labeling (with Plugin)

When using the Vite or Babel plugin, state variables are automatically labeled:

```typescript
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Plugin automatically injects:
  // __autoTracer.labelState("todos", 0, todos);
  // __autoTracer.labelState("filter", 1, filter);
  // __autoTracer.labelState("loading", 2, loading);

  // ...
}

// Console output shows labeled state:
// [TodoList] Rendering ⚡
//   State change todos: [] → [{id: 1, text: "Buy milk"}]
//   State change filter: "all" → "completed"
```

### Manual State Labeling (without Plugin)

If you're not using the plugin, you can manually label state variables using the `useAutoTracer` hook:

```typescript
import { useAutoTracer } from '@auto-tracer/react18';

function TodoList() {
  const logger = useAutoTracer();

  const [todos, setTodos] = useState([]);
  logger.labelState("todos", 0, todos);

  const [filter, setFilter] = useState('all');
  logger.labelState("filter", 1, filter);

  // ...
}
```

The index parameter (second argument) must match the order in which hooks are declared in your component. `useState` calls are numbered starting from 0.

### Tracing Custom Hooks

Custom hooks are traced along with the components that use them:

```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}

function App() {
  const counter = useCounter(10);

  // Console shows state from the custom hook:
  // [App] Rendering ⚡
  //   State change count: 10 → 11
}
```

### Filtering Noisy Components

In large applications with many third-party components, the console can become overwhelming. Use exclusion patterns to focus on your own components:

```typescript
autoTracer({
  componentsToExclude: [
    'ForwardRef',
    'Memo',
    'Context.Provider',
    'MuiBox*',
    'MuiButton*',
    'MuiTypography*',
  ],
});
```

### Detecting Performance Issues

Enable identical value change detection to find performance bottlenecks:

```typescript
autoTracer({
  detectIdenticalValueChanges: true,
});

// Example anti-pattern that will be flagged:
function TodoList() {
  const [todos] = useState([{ id: 1, text: "Buy milk" }]);

  // ❌ BAD - creates new object every render
  const data = { todos };

  return <ChildComponent data={data} />;

  // Console output:
  // ⚠️ data (identical value): {todos: [{...}]} → {todos: [{...}]}
}
```

## Advanced Configuration

### Conditional Tracing Based on Environment

Enable tracing only in development mode:

```typescript
autoTracer({
  enabled: process.env.NODE_ENV === 'development',
});
```

Or use environment variables for fine-grained control:

```typescript
autoTracer({
  enabled: import.meta.env.VITE_ENABLE_TRACING === 'true',
  logStateChanges: import.meta.env.VITE_LOG_STATE_CHANGES === 'true',
  componentsToTrace: import.meta.env.VITE_TRACE_COMPONENTS?.split(',') || ['*'],
});
```

### Combining Include and Exclude Patterns

Trace only components in specific features while excluding third-party libraries:

```typescript
autoTracer({
  componentsToTrace: ['Todo*', 'User*', 'Dashboard*'],
  componentsToExclude: ['MuiBox*', 'ForwardRef', 'Memo'],
});
```

### Debugging Specific Interactions

Focus tracing on specific user interactions by dynamically enabling/disabling:

```typescript
import { autoTracer, stopAutoTracer } from '@auto-tracer/react18';

// Start tracing when user clicks a debug button
function enableDebugMode() {
  autoTracer({
    componentsToTrace: ['TodoList', 'TodoItem'],
    logStateChanges: true,
  });
}

// Stop tracing
function disableDebugMode() {
  stopAutoTracer();
}
```

### Custom Hook Patterns

When using the plugin with custom hooks that return objects, you may need to extract the actual state value:

```typescript
function useCustomHook(initialValue) {
  const [value, setValue] = useState(initialValue);
  return { value, setValue };
}

function Component() {
  const logger = useAutoTracer();

  const custom = useCustomHook("test");

  // For custom hooks returning objects, you may need to label the primitive:
  logger.labelState("custom", 0, custom.value);

  // This helps the tracer match the internal state value correctly
}
```

## Troubleshooting

### "AutoTracer is already active" Warning

If you see this warning, `autoTracer()` is being called multiple times. This typically happens with hot module replacement (HMR) in development. To fix:

```typescript
// Add a guard to prevent reinitialization
if (import.meta.env.DEV) {
  // Only initialize once
  if (!(window as any).__autoTracerInitialized) {
    autoTracer();
    (window as any).__autoTracerInitialized = true;
  }
}
```

### State Shows as "unknown"

If state changes show as "unknown" instead of the variable name, ensure:

1. The build plugin is configured correctly
2. The plugin is processing your component files (check `include`/`exclude` patterns)
3. Hook calls follow React naming conventions (start with `use`)
4. You're using the correct hook index when manually labeling

### Too Much Console Output

Reduce console noise by:

1. Excluding third-party components: `componentsToExclude: ['MuiBox*', 'ForwardRef']`
2. Tracing only specific components: `componentsToTrace: ['MyFeature*']`
3. Disabling prop logging: `logPropChanges: false`
4. Excluding verbose props: `statePropsToExclude: ['className', 'style', 'sx']`

### Plugin Not Transforming Code

Verify the plugin configuration:

**Vite**: Ensure `autoTracerPlugin()` is listed in the `plugins` array AFTER the React plugin:

```typescript
plugins: [
  react(),
  autoTracerPlugin({ /* ... */ }),
]
```

**Babel**: Ensure the plugin is in the `plugins` array in your Babel config:

```javascript
plugins: [
  ['@auto-tracer/plugin-babel-react18', { /* ... */ }],
]
```

For Next.js, ensure SWC is disabled to use Babel.

## Performance Considerations

Auto-Tracer is designed for development use only. It has minimal runtime overhead when disabled, but enabling it does introduce some performance cost:

**Console Logging Overhead**: Writing to the console is relatively expensive. In components that render frequently (e.g., on every mouse move), you may notice slowdown. Use component filtering to reduce logging volume.

**Fiber Tree Traversal**: Auto-Tracer walks React's fiber tree on every render. For very large component trees (hundreds of components), this can be noticeable.

**Recommendations**:

- Always disable in production: `enabled: process.env.NODE_ENV === 'development'`
- Use component filtering to focus on specific areas of your app
- Disable prop change logging if you only need state changes
- Consider using `maxDepth` to limit tree traversal

## Best Practices

### Use Automatic Labeling When Possible

Manually labeling state is error-prone because you must maintain the correct index numbers as you add or remove hooks. Whenever possible, use the Vite or Babel plugin for automatic labeling.

### Start Broad, Then Focus

When debugging a new issue:

1. Start with tracing all components: `componentsToTrace: ['*']`
2. Identify the problematic area from the console output
3. Narrow down to specific components: `componentsToTrace: ['TodoList', 'TodoItem']`
4. Re-enable broader tracing if needed

### Use Exclusion Patterns for Third-Party Libraries

Material-UI, Ant Design, and other component libraries create many internal components that clutter the console. Exclude them:

```typescript
componentsToExclude: [
  'MuiBox*',
  'MuiButton*',
  'MuiTypography*',
  'ForwardRef',
  'Memo',
],
```

### Combine with React DevTools

Auto-Tracer complements React DevTools. Use Auto-Tracer to understand the timeline of renders and state changes, then use DevTools Profiler to measure performance impact.

### Document Component-Specific Patterns

If your team uses complex state patterns (e.g., custom hooks returning objects), document the labeling approach in your component files:

```typescript
/**
 * TodoList component
 *
 * State labeling:
 * - Hook 0: dispatch (from useAutoTracer)
 * - Hook 1: todos (from useState)
 * - Hook 2: filter (from useState)
 */
function TodoList() {
  const logger = useAutoTracer();
  const [todos, setTodos] = useState([]);
  logger.labelState("todos", 1, todos);
  // ...
}
```

## Examples

### Example 1: Basic Counter

```typescript
import { autoTracer } from '@auto-tracer/react18';

// Initialize once in main.tsx
autoTracer();

// Component
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Console output when clicking Increment:
// [Counter] Rendering ⚡
//   State change count: 0 → 1
```

### Example 2: Todo List with Filtering

```typescript
function TodoList() {
  const logger = useAutoTracer();

  const [todos, setTodos] = useState([
    { id: 1, text: "Buy milk", completed: false },
    { id: 2, text: "Walk dog", completed: true },
  ]);
  logger.labelState("todos", 0, todos);

  const [filter, setFilter] = useState("all");
  logger.labelState("filter", 1, filter);

  const filteredTodos = useMemo(() => {
    if (filter === "completed") return todos.filter(t => t.completed);
    if (filter === "active") return todos.filter(t => !t.completed);
    return todos;
  }, [todos, filter]);
  logger.labelState("filteredTodos", 2, filteredTodos);

  return (
    <div>
      <button onClick={() => setFilter("all")}>All</button>
      <button onClick={() => setFilter("active")}>Active</button>
      <button onClick={() => setFilter("completed")}>Completed</button>

      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

// Console output when clicking "Completed":
// [TodoList] Rendering ⚡
//   State change filter: "all" → "completed"
//   State change filteredTodos: [{...}, {...}] → [{id: 2, text: "Walk dog", completed: true}]
```

### Example 3: Redux Integration

```typescript
import { useSelector } from 'react-redux';
import { autoTracerPlugin } from '@auto-tracer/plugin-vite-react18';

// Vite config - use pattern to match all hooks including useSelector
export default defineConfig({
  plugins: [
    react(),
    autoTracerPlugin({
      labelHooksPattern: '^use[A-Z].*', // Matches useSelector, useState, etc.
    }),
  ],
});

// Component
function UserProfile() {
  const user = useSelector(state => state.auth.user);
  // Plugin auto-injects: __autoTracer.labelState("user", 0, user);

  return <div>Welcome, {user.name}!</div>;
}

// Console output when user logs in:
// [UserProfile] Rendering ⚡
//   State change user: null → {id: 123, name: "John Doe"}
```

### Example 4: Performance Debugging

```typescript
autoTracer({
  detectIdenticalValueChanges: true,
  componentsToTrace: ['ExpensiveComponent'],
});

function ExpensiveComponent() {
  const [data] = useState({ items: [1, 2, 3] });

  // ❌ BAD - creates new object every render
  const config = { data };

  return <ChildComponent config={config} />;
}

// Console output:
// [ExpensiveComponent] Rendering ⚡
// [ChildComponent] Rendering ⚡
//   ⚠️ config (unnecessary rerender): {data: {...}} → {data: {...}}
```

## API Reference

### Runtime API

#### `autoTracer(options?)`

Initializes the Auto-Tracer global render monitor.

**Parameters:**
- `options` (optional): Configuration object (see Configuration Options)

**Returns:** Cleanup function to stop tracing

```typescript
const cleanup = autoTracer({ enabled: true });

// Later, stop tracing
cleanup();
```

#### `stopAutoTracer()`

Stops the Auto-Tracer global render monitor.

```typescript
stopAutoTracer();
```

#### `useAutoTracer()`

Hook that returns a logger instance for manual state labeling.

**Returns:** Logger object with `labelState()` method

```typescript
const logger = useAutoTracer();
logger.labelState("count", 0, count);
```

### Build Plugin API

#### Vite Plugin: `autoTracerPlugin(options?)`

```typescript
import { autoTracerPlugin } from '@auto-tracer/plugin-vite-react18';

autoTracerPlugin({
  labelHooks: ['useState', 'useReducer'],
  labelHooksPattern: undefined,
  include: ['**/*.tsx', '**/*.jsx'],
  exclude: [],
});
```

#### Babel Plugin: `@auto-tracer/plugin-babel-react18`

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@auto-tracer/plugin-babel-react18', {
      labelHooks: ['useState', 'useReducer'],
      labelHooksPattern: undefined,
      include: ['**/*.tsx', '**/*.jsx'],
      exclude: [],
    }],
  ],
};
```

## Limitations

### React 18 Only

Auto-Tracer requires React 18 or later. It relies on internal fiber structures that changed significantly in React 18.

### DevTools Dependency

Auto-Tracer requires React DevTools to be available. In development mode with most build tools, this is automatic. In custom environments, ensure `react-dom` includes the DevTools hook.

### Custom Hooks Returning Objects

When custom hooks return objects containing state values, automatic labeling may not work correctly because the tracer sees the wrapper object, not the internal state primitive. In these cases, manual labeling of the primitive value is recommended:

```typescript
const custom = useCustomHook(); // Returns { value, setValue }
logger.labelState("custom", 0, custom.value); // Label the primitive
```

### Build-Time Injection Limitations

The plugin uses static analysis and cannot handle:
- Dynamically generated hook calls
- Hooks called conditionally (which violates React rules anyway)
- Hooks imported with aliases or destructured from objects

## License

MIT

## Contributing

Contributions are welcome! Please see the repository for contribution guidelines.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
