# Identical Value Changes Detection Specification

## Overview

The `detectIdenticalValueChanges` feature flags state and prop changes where the reference changed but the content is identical. This is a common React performance anti-pattern where new object/array references are created with the same data, causing unnecessary component re-renders.

## User-Facing Configuration

### Runtime Option

```typescript
autoTracer({
  detectIdenticalValueChanges: true, // Default: true
});
```

When enabled, Auto-Tracer performs deep equality comparison on state and prop values. If the reference changed (`prevValue !== currentValue`) but the content is identical (deep equality passes), it flags this as an identical value change.

## Detection Strategy

### For State Changes

When a state value changes, compare:

1. **Reference equality**: `prevValue !== currentValue`
2. **Deep equality**: `stringify(prevValue) === stringify(currentValue)`

If both conditions are true, this is an identical value change.

### For Prop Changes

Same logic applies to props:

1. **Reference equality**: `prevProp !== currentProp`
2. **Deep equality**: `stringify(prevProp) === stringify(currentProp)`

### Implementation Location

The detection happens in `walkFiberForUpdates.ts` where state and prop changes are already being identified:

```typescript
// Current code (simplified):
const meaningfulStateChanges = useStateValues.filter(
  ({ name, value, prevValue }) => {
    return (
      prevValue !== undefined &&
      prevValue !== value &&
      !isReactInternal(name) &&
      value !== AUTOTRACER_STATE_MARKER &&
      prevValue !== AUTOTRACER_STATE_MARKER
    );
  }
);

// Enhanced with identical value change detection:
const meaningfulStateChanges = useStateValues
  .filter(({ name, value, prevValue }) => {
    return (
      prevValue !== undefined &&
      prevValue !== value &&
      !isReactInternal(name) &&
      value !== AUTOTRACER_STATE_MARKER &&
      prevValue !== AUTOTRACER_STATE_MARKER
    );
  })
  .map(({ name, value, prevValue, hook }) => {
    // Detect identical value change
    const isIdenticalValueChange =
      traceOptions.detectIdenticalValueChanges &&
      stringify(prevValue) === stringify(value);

    return { name, value, prevValue, hook, isIdenticalValueChange };
  });
```

## Logging Format

### State Change (Normal)

```
State change count: 0 → 1
```

### State Change (Identical Value)

```
⚠️ State change filteredTodos (identical value): [{id: 1, text: "Buy milk"}] → [{id: 1, text: "Buy milk"}]
```

### Prop Change (Normal)

```
Prop change userId: 123 → 456
```

### Prop Change (Identical Value)

```
⚠️ Prop change config (identical value): {theme: "dark"} → {theme: "dark"}
```

### Visual Indicators

- Prefix with `⚠️` (warning emoji)
- Add `(identical value)` label after the variable name
- Use yellow/orange color in console (if styled logging is enabled)

## Common Scenarios Detected

### Scenario 1: Object Wrapper in Custom Hook

```typescript
function useTodo() {
  const [todo] = useState({ id: 1, text: "Buy milk" });
  return { todo }; // ❌ New object reference every render!
}

function App() {
  const result = useTodo();
  useEffect(() => {
    console.log("Changed!");
  }, [result]); // Triggers every render
  return <TodoList data={result} />;
}

// Console output:
// [App] Rendering ⚡
// [TodoList] Rendering ⚡
//   ⚠️ Prop change data (identical value): {todo: {...}} → {todo: {...}}
```

### Scenario 2: Array Creation in Render

```typescript
function TodoList() {
  const [todos] = useState([{ id: 1, text: "Buy milk", completed: false }]);

  // ❌ Creates new array every render
  const activeTodos = todos.filter((t) => !t.completed);

  return <TodoItems items={activeTodos} />;
}

// Console output:
// [TodoList] Rendering ⚡
// [TodoItems] Rendering ⚡
//   ⚠️ Prop change items (identical value): [{...}] → [{...}]
```

### Scenario 3: Inline Object in JSX

```typescript
function Header() {
  return (
    <Navbar style={{ backgroundColor: "blue" }} /> // ❌ New object every render
  );
}

// Console output:
// [Header] Rendering ⚡
// [Navbar] Rendering ⚡
//   ⚠️ Prop change style (identical value): {backgroundColor: "blue"} → {backgroundColor: "blue"}
```

### Scenario 4: Redux Selector Without Memoization

```typescript
function UserList() {
  // ❌ Returns new array every time if not memoized
  const users = useSelector((state) => state.users.filter((u) => u.active));

  return <List items={users} />;
}

// Console output when ANY Redux state changes:
// [UserList] Rendering ⚡
//   ⚠️ State change users (identical value): [{...}, {...}] → [{...}, {...}]
```

### Scenario 5: Inline Arrow Function Props

```typescript
function TodoItem({ todo, onDelete }) {
  return (
    <div>
      <span>{todo.text}</span>
      {/* ❌ Creates new function every render */}
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}

// Console output on every render:
// [TodoItem] Rendering ⚡
// [button] Rendering ⚡
//   Prop change onClick: (fn:123) → (fn:124)
```

**Fix with useCallback**:

```typescript
function TodoItem({ todo, onDelete }) {
  const handleDelete = useCallback(
    () => onDelete(todo.id),
    [todo.id, onDelete]
  );
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

// Console output - no warning:
// [TodoItem] Rendering ⚡
// [button] No render (props unchanged)
```

### Scenario 6: Inline Object with Function Property

```typescript
function Form() {
  return (
    <Input
      validation={{
        required: true,
        validator: (val) => val.length > 3, // ❌ New function every render
      }}
    />
  );
}

// Console output:
// [Form] Rendering ⚡
// [Input] Rendering ⚡
//   Prop change validation: {required: true, validator: (fn:45)} → {required: true, validator: (fn:46)}
```

## Implementation Requirements

### 1. Update Stringify Implementation

**Background**: The current implementation uses `flatted` for circular reference handling. However, `flatted` doesn't guarantee stable key ordering for objects, which can cause false positives when comparing objects with identical content but different key orders. We'll switch to `safe-stable-stringify` for production code while keeping `flatted` for test fixtures (which require deserialization via `parse()`).

### 1a. Remove `showFunctionContentOnChange` Option

**Rationale**: With function identity tracking (`(fn:123)`), showing full function content is always too much noise and provides no additional value. The function ID is sufficient for debugging inline function issues.

**File**: `packages/auto-tracer-react18/src/lib/interfaces/AutoTracerOptions.ts`

Remove the `showFunctionContentOnChange` option from the interface:

```typescript
interface AutoTracerOptions {
  enabled?: boolean;
  includeReconciled?: boolean;
  includeSkipped?: boolean;
  showFlags?: boolean;
  enableAutoTracerInternalsLogging?: boolean;
  maxFiberDepth?: number;
  // REMOVE: showFunctionContentOnChange?: boolean;
  skipNonTrackedBranches?: boolean;
  skippedObjectProps?: SkippedObjectProp[];
  detectIdenticalValueChanges?: boolean;

  colors?: {
    // ... existing color options
  };
}
```

**File**: `packages/auto-tracer-react18/src/lib/types/defaultSettings.ts`

Remove from default settings:

```typescript
export const defaultAutoTracerOptions: AutoTracerOptions = {
  enabled: true,
  includeReconciled: false,
  includeSkipped: false,
  showFlags: false,
  enableAutoTracerInternalsLogging: false,
  maxFiberDepth: 100,
  // REMOVE: showFunctionContentOnChange: false,
  skipNonTrackedBranches: true,
  skippedObjectProps: [],
  detectIdenticalValueChanges: true,

  colors: {
    // ... existing color configurations
  },
};
```

**File**: `packages/auto-tracer-react18/src/lib/functions/changeFormatting.ts`

Simplify formatting functions to always show function IDs:

```typescript
/**
 * Format a value for display in prop changes
 * Functions are always shown as (fn:id) with identity tracking
 */
export function formatPropValue(value: unknown): string {
  return stringify(value);
}

/**
 * Format a prop change for display
 */
export function formatPropChange(before: unknown, after: unknown): string {
  return `${stringify(before)} → ${stringify(after)}`;
}

/**
 * Format a state value for display
 * Functions are always shown as (fn:id) with identity tracking
 */
export function formatStateValue(value: unknown): string {
  return stringify(value);
}

/**
 * Format a state change for display
 */
export function formatStateChange(before: unknown, after: unknown): string {
  return `${stringify(before)} → ${stringify(after)}`;
}
```

**Note**: Remove the `FormatOptions` interface entirely as it's no longer needed.

**File**: `packages/auto-tracer-react18/src/lib/functions/deepMerge.ts`

Remove the `showFunctionContentOnChange` merge logic (search for references and remove).

**File**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

Update all calls to `formatStateValue` and `formatPropValue` to remove the options parameter:

```typescript
// Before:
formatStateValue(value, { showFunctionContent: traceOptions.showFunctionContentOnChange ?? false })

// After:
formatStateValue(value)
```

**File**: `packages/auto-tracer-react18/tests/**/*.test.ts`

Remove all test references to `showFunctionContentOnChange`.

### 1b. Add Package Dependencies

**File**: `packages/auto-tracer-react18/package.json`

Move `flatted` to devDependencies (it's already there) and add `safe-stable-stringify` as a production dependency:

```json
{
  "dependencies": {
    "safe-stable-stringify": "^2.4.3",
    "tslib": "^2.6.3"
  },
  "devDependencies": {
    "@testing-library/react": "^14.3.1",
    "flatted": "^3.3.3"
  }
}
```

**Note**: `flatted` remains in devDependencies for test fixture parsing (`.fixture.flatted` files use `flatted.parse()`).

### 1c. Implement Function Identity Tracking

Update the stringify implementation to use `safe-stable-stringify` for stable key ordering and add function identity tracking:

```typescript
/**
 * Configurable stringify wrapper for autoTracer
 * Uses safe-stable-stringify for deterministic output with stable key ordering
 * Tracks function identity to detect identical inline functions
 */

import safeStringify from "safe-stable-stringify";

/**
 * WeakMap to track unique function instances
 * - Key: function object reference
 * - Value: unique numeric ID
 *
 * Memory Safety:
 * - Uses WeakMap for automatic garbage collection
 * - When a function is no longer referenced, GC automatically removes the WeakMap entry
 * - Map only holds entries for currently-referenced functions in the app
 * - Does NOT grow unbounded - memory scales with "functions in memory now", not "functions created ever"
 */
let functionIdCounter = 0;
const functionIdentityMap = new WeakMap<Function, number>();

/**
 * Get or assign a unique ID for a function instance
 *
 * @param fn - Function to identify
 * @returns Unique numeric ID for this function instance
 *
 * Purpose:
 * - Enables detection of inline function anti-pattern (new function every render)
 * - Allows comparison: "(fn:1)" vs "(fn:2)" reveals different instances with identical code
 * - Works with useCallback: same function reference = same ID across renders
 */
function getFunctionId(fn: Function): number {
  if (!functionIdentityMap.has(fn)) {
    functionIdentityMap.set(fn, ++functionIdCounter);
  }
  return functionIdentityMap.get(fn)!;
}

/**
 * Main stringify function used by autoTracer
 *
 * Features:
 * - Stable key ordering (ensures {a: 1, b: 2} === {b: 2, a: 1})
 * - Circular reference handling (replaces with "[Circular]")
 * - Function identity tracking (replaces with "(fn:123)" for unique detection)
 * - Deterministic output for reliable value comparison
 */
export function stringify(value: unknown): string {
  try {
    // Handle functions as primitives to avoid JSON string quoting
    if (typeof value === "function") {
      return `(fn:${getFunctionId(value)})`;
    }

    // Handle other primitives directly
    if (value === null || value === undefined) {
      return String(value);
    }

    if (typeof value !== "object") {
      return String(value);
    }

    // Use safeStringify for objects/arrays with replacer for nested functions
    const result = safeStringify(value, (key, val) => {
      // Replace nested functions with unique identity marker
      if (typeof val === "function") {
        return `(fn:${getFunctionId(val)})`;
      }
      return val;
    });
    return result ?? "[Unserializable]";
  } catch (error) {
    // Fallback to safe string representation on any error
    try {
      return `[Error serializing: ${
        error instanceof Error ? error.message : String(error)
      }]`;
    } catch {
      return "[Unserializable]";
    }
  }
}
```

**Testing Requirements**:

- All existing stringify tests must pass with the new implementation
- Add specific test for stable key ordering: `{b: 2, a: 1}` should stringify identically to `{a: 1, b: 2}`
- Verify circular reference handling still works (user state might contain circular refs)
- **Add test for function identity tracking**: Same function reference should get same ID across multiple stringify calls
- **Add test for different function instances**: Different function objects (even with identical source) should get different IDs
- Test fixtures will continue using `flatted.parse()` for deserialization - no changes needed

**Why This Matters for detectIdenticalValueChanges**:

1. **Stable Key Ordering**: Without it, objects like `{filter: 'all', sortBy: 'date'}` and `{sortBy: 'date', filter: 'all'}` would be flagged as different even though they're identical, causing false positives.

2. **Function Identity Tracking**: Enables detection of the inline function anti-pattern - one of the most common React performance issues:

   ```tsx
   // ❌ BAD: Creates new function every render
   <Button onClick={() => handleClick(id)} />;
   // stringify outputs: "(fn:1)" → "(fn:2)" → "(fn:3)" ...
   // Shows as normal prop change with incrementing IDs (visual indicator of problem)

   // ✅ GOOD: Reuses same function reference
   const onClick = useCallback(() => handleClick(id), [id]);
   <Button onClick={onClick} />;
   // stringify outputs: "(fn:1)" → "(fn:1)" → "(fn:1)" ...
   // No change - same function reference (same ID)
   ```

### 2. Add Option to AutoTracerOptions Interface

**File**: `packages/auto-tracer-react18/src/lib/interfaces/AutoTracerOptions.ts`

Add the new option to the interface (after line 24, before the `colors` section):

```typescript
interface AutoTracerOptions {
  enabled?: boolean;
  includeReconciled?: boolean;
  includeSkipped?: boolean;
  showFlags?: boolean;
  enableAutoTracerInternalsLogging?: boolean;
  maxFiberDepth?: number;
  skipNonTrackedBranches?: boolean;
  skippedObjectProps?: SkippedObjectProp[];
  detectIdenticalValueChanges?: boolean; // ADD THIS - Detect reference changes with identical content (default: true)

  colors?: {
    // ... existing color options
  };
}
```

### 3. Add to Default Settings

**File**: `packages/auto-tracer-react18/src/lib/types/defaultSettings.ts`

Add to `defaultAutoTracerOptions` after line 15 (after `skippedObjectProps`):

```typescript
export const defaultAutoTracerOptions: AutoTracerOptions = {
  enabled: true,
  includeReconciled: false,
  includeSkipped: false,
  showFlags: false,
  enableAutoTracerInternalsLogging: false,
  maxFiberDepth: 100,
  skipNonTrackedBranches: true,
  skippedObjectProps: [],
  detectIdenticalValueChanges: true, // ADD THIS - Enable by default for development

  colors: {
    // ... existing color configurations
  },
};
```

### 4. Add Color Configuration for Warnings (Optional)

**File**: `packages/auto-tracer-react18/src/lib/interfaces/AutoTracerOptions.ts`

Add a new color option for identical value warnings in the `colors` object:

```typescript
interface AutoTracerOptions {
  // ... existing options

  colors?: {
    definitiveRender?: ColorOptions;
    propInitial?: ColorOptions;
    propChange?: ColorOptions;
    stateInitial?: ColorOptions;
    stateChange?: ColorOptions;
    logStatements?: ColorOptions;
    reconciled?: ColorOptions;
    skipped?: ColorOptions;
    identicalStateValueWarning?: ColorOptions; // ADD THIS - For identical state value change warnings
    identicalPropValueWarning?: ColorOptions; // ADD THIS - For identical prop value change warnings
    other?: ColorOptions;
  };
}
```

**File**: `packages/auto-tracer-react18/src/lib/types/defaultSettings.ts`

Add default colors for the warning in the `colors` section:

```typescript
export const defaultAutoTracerOptions: AutoTracerOptions = {
  // ... existing options

  colors: {
    // ... existing color configurations
    identicalStateValueWarning: {
      icon: "⚠️",
      lightMode: { text: "#df7f02", bold: true }, // Same orange as stateChange, bold
      darkMode: { text: "#ffcf33", bold: true }, // Same lighter orange as stateChange, bold
    },
    identicalPropValueWarning: {
      icon: "⚠️",
      lightMode: { text: "#c900bf", bold: true }, // Same magenta as propChange, bold
      darkMode: { text: "#ff77e8", bold: true }, // Same lighter magenta as propChange, bold
    },
    other: {
      // ... existing config
    },
  },
};
```

### 5. Add Styled Logging Function for Warnings (Optional)

**File**: `packages/auto-tracer-react18/src/lib/functions/styledLogger.ts`

Add two new styled logger functions for identical value warnings:

```typescript
/**
 * Log identical state value change warnings with theme-aware colors
 */
export function logIdenticalStateValueWarning(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colors = options.getColors();
  const themeMode = options.themeManager.isDarkMode()
    ? "darkMode"
    : "lightMode";
  const colorConfig = colors.identicalStateValueWarning?.[themeMode];
  const icon = colors.identicalStateValueWarning?.icon || "⚠️";

  if (!colorConfig) {
    safeLog(`${prefix}${icon} ${message}`);
    return;
  }

  const styles = buildCSSString(colorConfig);
  safeLog(`${prefix}%c${icon} ${message}`, styles);
}

/**
 * Log identical prop value change warnings with theme-aware colors
 */
export function logIdenticalPropValueWarning(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colors = options.getColors();
  const themeMode = options.themeManager.isDarkMode()
    ? "darkMode"
    : "lightMode";
  const colorConfig = colors.identicalPropValueWarning?.[themeMode];
  const icon = colors.identicalPropValueWarning?.icon || "⚠️";

  if (!colorConfig) {
    safeLog(`${prefix}${icon} ${message}`);
    return;
  }

  const styles = buildCSSString(colorConfig);
  safeLog(`${prefix}%c${icon} ${message}`, styles);
}
```

**File**: `packages/auto-tracer-react18/src/lib/functions/log.ts`

Export the new warning loggers:

```typescript
import {
  // ... existing imports
  logIdenticalStateValueWarning as logIdenticalStateValueWarningStyled,
  logIdenticalPropValueWarning as logIdenticalPropValueWarningStyled,
} from "./styledLogger.js";

// ... existing code

/**
 * Styled logging for identical state value change warnings with theme-aware colors
 */
export function logIdenticalStateValueWarning(
  prefix: string,
  message: string
): void {
  logIdenticalStateValueWarningStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for identical prop value change warnings with theme-aware colors
 */
export function logIdenticalPropValueWarning(
  prefix: string,
  message: string
): void {
  logIdenticalPropValueWarningStyled(prefix, message, styledLoggerOptions);
}
```

### 6. Detect in State Changes

**File**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

In the state change detection section (around line 200-230):

```typescript
// Add isIdenticalValueChange flag to each state change
const stateChangesWithFlags = meaningfulStateChanges.map(
  ({ name, value, prevValue, hook }) => {
    const isIdenticalValueChange =
      traceOptions.detectIdenticalValueChanges &&
      stringify(prevValue) === stringify(value);

    return { name, value, prevValue, hook, isIdenticalValueChange };
  }
);

// Update logging to use the flag
stateChangesWithFlags.forEach(
  ({ name, value, prevValue, hook, isIdenticalValueChange }) => {
    const anchorIndex = anchorsUpdate.indexOf(hook as Hook);
    const label = resolveHookLabel(guid, anchorIndex, value, allAnchorsUpdate);

    const suffix = isIdenticalValueChange ? " (identical value)" : "";
    const message = `State change ${label}${suffix}: ${formatStateValue(
      prevValue
    )} → ${formatStateValue(value)}`;

    if (isIdenticalValueChange) {
      logIdenticalStateValueWarning(`${indent}│   `, message);
    } else {
      logStateChange(`${indent}│   `, message, isInitialRender);
    }
  }
);
```

### 7. Detect in Prop Changes

**File**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

In the prop change detection section (around line 300-340):

```typescript
// Add identical value change detection for props
const propChangesWithFlags = propChanges.map(({ name, oldValue, newValue }) => {
  const isIdenticalValueChange =
    traceOptions.detectIdenticalValueChanges &&
    stringify(oldValue) === stringify(newValue);

  return { name, oldValue, newValue, isIdenticalValueChange };
});

// Update logging
propChangesWithFlags.forEach(
  ({ name, oldValue, newValue, isIdenticalValueChange }) => {
    const suffix = isIdenticalValueChange ? " (identical value)" : "";
    const message = `Prop change ${name}${suffix}: ${formatPropValue(
      oldValue
    )} → ${formatPropValue(newValue)}`;

    if (isIdenticalValueChange) {
      logIdenticalPropValueWarning(`${indent}│   `, message);
    } else {
      logPropChange(`${indent}│   `, message);
    }
  }
);
```

### 8. Update TypeScript Exports

**File**: `packages/auto-tracer-react18/src/lib/functions/log.ts`

Ensure the new warning logger is exported:

```typescript
export {
  log,
  logGroup,
  logGroupEnd,
  logWarn,
  logError,
  logDefinitive,
  logPropChange,
  logStateChange,
  logLogStatement,
  logReconciled,
  logSkipped,
  logIdenticalStateValueWarning, // ADD THIS
  logIdenticalPropValueWarning, // ADD THIS
};
```

### 9. Import in walkFiberForUpdates

**File**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

Add the import at the top of the file:

```typescript
import {
  log,
  logDefinitive,
  logPropChange,
  logStateChange,
  logLogStatement,
  logReconciled,
  logSkipped,
  logIdenticalStateValueWarning, // ADD THIS
  logIdenticalPropValueWarning, // ADD THIS
} from "./log.js";
```

## Testing Requirements

### Unit Tests

**File**: `packages/auto-tracer-react18/tests/lib/functions/stringify.test.ts`

```typescript
describe("stringify - Function Identity Tracking", () => {
  it("should assign unique ID to each function instance", () => {
    const fn1 = () => console.log("test");
    const fn2 = () => console.log("test"); // Same source, different instance

    const str1 = stringify(fn1);
    const str2 = stringify(fn2);

    expect(str1).toMatch(/^\(fn:\d+\)$/); // Format: "(fn:123)"
    expect(str2).toMatch(/^\(fn:\d+\)$/);
    expect(str1).not.toBe(str2); // Different IDs for different instances
  });

  it("should reuse same ID for same function reference", () => {
    const fn = () => console.log("test");

    const str1 = stringify(fn);
    const str2 = stringify(fn);
    const str3 = stringify(fn);

    expect(str1).toBe(str2);
    expect(str2).toBe(str3); // Same function = same ID
  });

  it("should track functions inside objects", () => {
    const onClick1 = () => console.log("click");
    const onClick2 = () => console.log("click");

    const obj1 = { handler: onClick1 };
    const obj2 = { handler: onClick2 };

    expect(stringify(obj1)).not.toBe(stringify(obj2)); // Different function IDs
  });

  it("should track functions inside arrays", () => {
    const fn1 = () => 1;
    const fn2 = () => 1;

    const arr1 = [fn1, fn2];
    const arr2 = [fn1, fn2]; // Same references

    expect(stringify(arr1)).toBe(stringify(arr2)); // Same IDs, same order
  });

  it("should maintain stable key ordering for objects", () => {
    const obj1 = { b: 2, a: 1 };
    const obj2 = { a: 1, b: 2 };

    expect(stringify(obj1)).toBe(stringify(obj2)); // Key order normalized
  });
});
```

**File**: `packages/auto-tracer-react18/tests/lib/functions/walkFiberForUpdates.detectIdentical.test.ts`

```typescript
describe("walkFiberForUpdates - Identical Value Change Detection", () => {
  it("should detect identical value change (array with same content)", () => {
    // Setup: State changes from one array to a different array with same content
    const prevArray = [{ id: 1, text: "Buy milk" }];
    const currentArray = [{ id: 1, text: "Buy milk" }]; // Different reference

    expect(prevArray).not.toBe(currentArray); // Different references
    expect(stringify(prevArray)).toBe(stringify(currentArray)); // Same content

    // Should log: ⚠️ State change filteredTodos (identical value): [...] → [...]
  });

  it("should detect identical value change (object with same content)", () => {
    const prevObj = { theme: "dark", lang: "en" };
    const currentObj = { theme: "dark", lang: "en" }; // Different reference

    expect(prevObj).not.toBe(currentObj);
    expect(stringify(prevObj)).toBe(stringify(currentObj));

    // Should log: ⚠️ State change config (identical value): {...} → {...}
  });

  it("should NOT flag when content actually changes", () => {
    const prevArray = [{ id: 1, text: "Buy milk" }];
    const currentArray = [
      { id: 1, text: "Buy milk" },
      { id: 2, text: "Walk dog" },
    ];

    expect(prevArray).not.toBe(currentArray);
    expect(stringify(prevArray)).not.toBe(stringify(currentArray));

    // Should log normal: State change todos: [...] → [...]
  });

  it("should NOT flag when value is primitive and actually changes", () => {
    const prevCount = 0;
    const currentCount = 1;

    expect(stringify(prevCount)).not.toBe(stringify(currentCount));

    // Should log normal: State change count: 0 → 1
  });

  it("should respect detectIdenticalValueChanges setting", () => {
    // When detectIdenticalValueChanges: false
    // Should NOT add warning prefix or suffix even if content is identical
  });

  it("should NOT flag function instance changes as identical", () => {
    const fn1 = () => console.log("click");
    const fn2 = () => console.log("click"); // Different instance

    expect(fn1).not.toBe(fn2); // Different references
    expect(stringify(fn1)).not.toBe(stringify(fn2)); // Different IDs: "(fn:1)" vs "(fn:2)"

    // Should log normal prop change (NOT identical value warning):
    // Prop change onClick: (fn:1) → (fn:2)
  });

  it("should NOT flag when same function reference is reused (useCallback)", () => {
    const fn = () => console.log("click");

    expect(stringify(fn)).toBe(stringify(fn)); // Same reference = same ID

    // Should NOT log warning - same function reference
  });

  it("should NOT flag functions in object props as identical", () => {
    const handler1 = () => save();
    const handler2 = () => save(); // Different instance, same code

    const config1 = { onSave: handler1 };
    const config2 = { onSave: handler2 };

    expect(stringify(config1)).not.toBe(stringify(config2)); // Different function IDs

    // Should log normal prop change (NOT identical value warning):
    // Prop change config: {onSave: (fn:1)} → {onSave: (fn:2)}
  });
});
```

### E2E Tests

**File**: `apps/todo-example-vite-injected/tests/identical-value-changes.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("should detect identical value change from inline object prop", async ({
  page,
}) => {
  await page.goto("/");

  const logs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "log") {
      logs.push(msg.text());
    }
  });

  // Trigger render that causes identical value change
  await page.click('[data-testid="trigger-identical-value-change"]');

  // Wait for logs
  await page.waitForTimeout(100);

  // Verify warning appears for objects/arrays with identical content
  const warningLogs = logs.filter(
    (log) => log.includes("⚠️") && log.includes("(identical value)")
  );

  expect(warningLogs.length).toBeGreaterThan(0);
  expect(warningLogs[0]).toContain("Prop change");
});

test("should show function ID changes without identical value warning", async ({
  page,
}) => {
  await page.goto("/");

  const logs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "log") {
      logs.push(msg.text());
    }
  });

  // Trigger render with inline function
  await page.click('[data-testid="trigger-inline-function"]');

  // Wait for logs
  await page.waitForTimeout(100);

  // Verify function changes show incrementing IDs without warning
  const functionChangeLogs = logs.filter(
    (log) => log.includes("Prop change") && log.match(/\(fn:\d+\)/)
  );

  expect(functionChangeLogs.length).toBeGreaterThan(0);
  // Should NOT include "(identical value)" - just normal prop change
  expect(functionChangeLogs[0]).not.toContain("(identical value)");
});

test("should NOT flag when content actually changes", async ({ page }) => {
  await page.goto("/");

  const logs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "log") {
      logs.push(msg.text());
    }
  });

  // Trigger normal state change
  await page.click('[data-testid="add-todo"]');

  // Wait for logs
  await page.waitForTimeout(100);

  // Verify NO warning appears for legitimate changes
  const normalLogs = logs.filter(
    (log) => log.includes("State change") && !log.includes("(identical value)")
  );

  expect(normalLogs.length).toBeGreaterThan(0);
});
```

## Performance Considerations

### stringify() Cost

Deep equality comparison using `stringify()` has a cost, especially for large objects/arrays. However:

- Only runs when `detectIdenticalValueChanges: true` (user opt-in)
- Only runs on values that already changed (reference inequality)
- The cost is acceptable for development tooling
- Users can disable it if performance is critical

### Optimization Strategies

1. **Skip primitives**: No need to deep compare primitives (string, number, boolean, null, undefined)

   ```typescript
   const isPrimitive = (value: unknown): boolean => {
     return (
       value === null ||
       (typeof value !== "object" && typeof value !== "function")
     );
   };

   if (isPrimitive(prevValue) && isPrimitive(value)) {
     // Skip deep comparison, reference inequality means content changed
     isIdenticalValueChange = false;
   } else {
     // Only deep compare objects/arrays
     isIdenticalValueChange = stringify(prevValue) === stringify(value);
   }
   ```

2. **Size threshold**: Skip deep comparison for very large objects (>1000 characters)

   ```typescript
   const MAX_SIZE_FOR_DEEP_COMPARE = 1000;

   // Stringify once and reuse for both size check and comparison
   const prevStr = stringify(prevValue);
   const currStr = stringify(value);

   if (prevStr.length > MAX_SIZE_FOR_DEEP_COMPARE || 
       currStr.length > MAX_SIZE_FOR_DEEP_COMPARE) {
     // Skip deep comparison for very large objects
     isIdenticalValueChange = false;
   } else {
     // Use pre-computed strings for comparison
     isIdenticalValueChange = prevStr === currStr;
   }
   ```

3. **Memoize stringify results**: Cache stringify results for current render cycle

   ```typescript
   const stringifyCache = new WeakMap<object, string>();

   const cachedStringify = (value: unknown): string => {
     if (typeof value !== "object" || value === null) {
       return stringify(value);
     }

     if (!stringifyCache.has(value)) {
       stringifyCache.set(value, stringify(value));
     }

     return stringifyCache.get(value)!;
   };
   ```

## User Education

### Documentation Updates

Update the following sections in `doc-v1.md`:

1. **"Why Use Auto-Tracer?"** section: Add concrete example of identical value change detection
2. **"Detecting Performance Issues"** usage pattern: Show real-world example with solution
3. **"Best Practices"** section: Add guidance on how to fix flagged issues

### Recommended Fixes in Documentation

When users see identical value change warnings, guide them to:

**Fix 1: Use useMemo for computed values**

```typescript
// ❌ BAD
const activeTodos = todos.filter((t) => !t.completed);

// ✅ GOOD
const activeTodos = useMemo(() => todos.filter((t) => !t.completed), [todos]);
```

**Fix 2: Memoize object wrappers**

```typescript
// ❌ BAD
return { todo };

// ✅ GOOD
return useMemo(() => ({ todo }), [todo]);
```

**Fix 3: Move constant objects outside component**

```typescript
// ❌ BAD
function Header() {
  return <Navbar style={{ backgroundColor: "blue" }} />;
}

// ✅ GOOD
const navbarStyle = { backgroundColor: "blue" };

function Header() {
  return <Navbar style={navbarStyle} />;
}
```

**Fix 4: Use Redux reselect for memoized selectors**

```typescript
// ❌ BAD
const users = useSelector((state) => state.users.filter((u) => u.active));

// ✅ GOOD
const selectActiveUsers = createSelector([(state) => state.users], (users) =>
  users.filter((u) => u.active)
);

const users = useSelector(selectActiveUsers);
```

## Summary

The `detectIdenticalValueChanges` feature helps developers identify a common React performance anti-pattern: creating new object/array references with identical content. By comparing references (shallow) and content (deep), it can flag these issues with clear warning messages in the console, along with guidance on how to fix them.

**Implementation Checklist**:

- [ ] Add `safe-stable-stringify` dependency to package.json
- [ ] Remove `showFunctionContentOnChange` from AutoTracerOptions interface
- [ ] Remove `showFunctionContentOnChange` from defaultSettings
- [ ] Remove `FormatOptions` interface from changeFormatting.ts
- [ ] Simplify `formatStateValue()` and `formatPropValue()` to always use stringify (no options param)
- [ ] Remove `showFunctionContentOnChange` merge logic from deepMerge.ts
- [ ] Update all `walkFiberForUpdates.ts` calls to formatters (remove options parameter)
- [ ] Remove `showFunctionContentOnChange` from all tests
- [ ] Update `stringify.ts` to use `safe-stable-stringify` for stable key ordering
- [ ] Add function identity tracking with WeakMap and auto-incrementing IDs
- [ ] Implement replacer function to convert functions to `(fn:id)` format
- [ ] Verify all existing tests pass with new stringify implementation
- [ ] Add unit tests for function identity tracking (same reference = same ID, different instances = different IDs)
- [ ] Add unit test for stable key ordering
- [ ] Add `detectIdenticalValueChanges` to AutoTracerOptions interface
- [ ] Add to defaultAutoTracerOptions (default: true)
- [ ] Add `identicalStateValueWarning` color configuration to AutoTracerOptions interface
- [ ] Add `identicalPropValueWarning` color configuration to AutoTracerOptions interface
- [ ] Add default colors for `identicalStateValueWarning` in defaultSettings (orange with bold and ⚠️)
- [ ] Add default colors for `identicalPropValueWarning` in defaultSettings (magenta with bold and ⚠️)
- [ ] Create `logIdenticalStateValueWarning()` function in styledLogger.ts
- [ ] Create `logIdenticalPropValueWarning()` function in styledLogger.ts
- [ ] Export `logIdenticalStateValueWarning()` from log.ts
- [ ] Export `logIdenticalPropValueWarning()` from log.ts
- [ ] Import both warning functions in walkFiberForUpdates.ts
- [ ] Implement detection in state change logging (walkFiberForUpdates.ts) using `logIdenticalStateValueWarning()`
- [ ] Implement detection in prop change logging (walkFiberForUpdates.ts) using `logIdenticalPropValueWarning()`
- [ ] Add unit tests for detection logic (objects, arrays, functions)
- [ ] Add E2E tests with real scenarios (inline functions, object wrappers, arrays)
- [ ] Optimize stringify performance (skip primitives, size threshold with cached strings)
- [ ] Update doc-v1.md with the new configuration option
- [ ] Update doc-v1.md with examples and fixes (including inline function anti-pattern)
- [ ] Add user education section on how to resolve warnings (useCallback, useMemo, constant extraction)
