# Auto-Tracer High-Level Specification

## Overview

This document specifies the expected behavior for detecting and logging React component props and state in the auto-tracer library.

---

## Top-Level Scenarios

### 1. Initial Prop Detection (Mount)

**When:** A tracked component mounts for the first time.

**Input (User Code):**

```tsx
// @trace
const MyComponent: React.FC<{ name: string; count: number }> = ({
  name,
  count,
}) => {
  return (
    <div>
      {name}: {count}
    </div>
  );
};

// Usage
<MyComponent name="Alice" count={5} />;
```

**Expected Output:**

```
Component render cycle 1:
├─ [MyComponent] Mount ⚡
│   Initial prop name: Alice
│   Initial prop count: 5
```

**Detection Logic:**

- Component has no alternate fiber (first render)
- Props are extracted from `memoizedProps` or `pendingProps`
- React internal props (like `children`, `key`, `ref`) are skipped
- Component-specific skipped props (from configuration) are filtered out

---

### 2. Initial Prop Output Formatting

**Function Props:**

```tsx
// @trace
const Button: React.FC<{ onClick: () => void; label: string }> = ({
  onClick,
  label,
}) => {
  return <button onClick={onClick}>{label}</button>;
};

// Usage
<Button onClick={() => console.log("clicked")} label="Submit" />;
```

**Expected Output:**

```
Component render cycle 1:
├─ [Button] Mount ⚡
│   Initial prop onClick: (fn:1)
│   Initial prop label: Submit
```

**Complex Objects:**

```tsx
// @trace
const UserCard: React.FC<{ user: { id: number; name: string } }> = ({
  user,
}) => {
  return <div>{user.name}</div>;
};

// Usage
<UserCard user={{ id: 1, name: "Bob" }} />;
```

**Expected Output:**

```
Component render cycle 1:
├─ [UserCard] Mount ⚡
│   Initial prop user: {"id":1,"name":"Bob"}
```

**Formatting Rules:**

- Primitives: displayed as-is
- Functions: `(fn:N)` where N is a stable identity number
- Objects/Arrays: JSON stringified with stable key ordering
- Complex objects (>1000 nodes): `[Too large object to render. >1000 nodes]`

---

### 3. Initial State Detection (Mount)

**When:** A tracked component with `useState` hooks mounts for the first time.

**Input (User Code):**

```tsx
// @trace
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("default");

  return (
    <div>
      {name}: {count}
    </div>
  );
};
```

**Expected Output (React fiber order):**

```
Component render cycle 1:
├─ [Counter] Mount ⚡
│   Initial state count: 0
│   Initial state name: default
│   Initial state setCount: (fn:2)
│   Initial state setName: (fn:3)
```

**Note:** React stores each `useState` call as a single hook with `memoizedState` containing the value. The setter is a function returned to user code, not stored in the fiber. Therefore, output shows:

1. All state values from the fiber (in useState call order: count, name)
2. All setters from labeled values not matched in fiber (setCount, setName)

This reflects how React internally organizes hooks, not the syntactic pairing in source code.

**Detection Logic:**

- Component is tracked (has useAutoTracer or matches auto-inject pattern)
- State variables are resolved via hook labels (injected by babel plugin or explicit labeling)
- Hook chain is traversed from `fiber.memoizedState`
- Values extracted from `hook.memoizedState` (only values with `.queue` property)
- Setters are logged from unmatched labels (functions not found in fiber hooks)

---

### 4. Initial State Output Formatting

**Primitive State:**

```tsx
const [active, setActive] = useState(true);
```

**Output:**

```
│   Initial state active: true
│   Initial state setActive: (fn:4)
```

**Object State:**

```tsx
const [user, setUser] = useState({ id: 1, name: "Alice" });
```

**Output:**

```
│   Initial state user: {"id":1,"name":"Alice"}
│   Initial state setUser: (fn:5)
```

**Array State:**

```tsx
const [items, setItems] = useState([1, 2, 3]);
```

**Output:**

```
│   Initial state items: [1,2,3]
│   Initial state setItems: (fn:6)
```

**Custom Hook State (with labeling):**

```tsx
const { value, increment, reset } = useMultiValueHook("initial");
```

**Output:**

```
│   Initial state value: initial
│   Initial state increment: (fn:7)
│   Initial state reset: (fn:8)
```

---

### 5. Prop Change Detection (Update)

**When:** A tracked component re-renders and props have changed.

**Input (User Code):**

```tsx
// Parent component that triggers re-render
const Parent: React.FC = () => {
  const [count, setCount] = useState(5);

  return (
    <>
      <button onClick={() => setCount(10)}>Update</button>
      <Display value={count} />
    </>
  );
};

// @trace
const Display: React.FC<{ value: number }> = ({ value }) => {
  return <div>{value}</div>;
};
```

**Expected Output (after button click):**

```
Component render cycle 2:
├─ [Display] Rendering ⚡
│   Prop change value: 5 → 10
```

**Detection Logic:**

- Component has an alternate fiber (previous render exists)
- Compare `fiber.memoizedProps` with `fiber.alternate.memoizedProps`
- Detect changes via reference inequality or deep equality check (for identical value warnings)
- Skip React internal props and configured skipped props

---

### 6. Prop Change Output Formatting

**Short Changes (<20 chars total):**

```tsx
// value changes from 5 to 10
```

**Output:**

```
│   Prop change value: 5 → 10
```

**Medium Changes (20-200 chars):**

```tsx
// user changes from { id: 1, name: "Alice" } to { id: 1, name: "Bob" }
```

**Output:**

```
│   Prop change user:
{"id":1,"name":"Alice"}
→
{"id":1,"name":"Bob"}
```

**Long Changes (>200 chars):**

```tsx
// Very large object changes
```

**Output:**

```
│   Prop change data:
{"key1":"value1","key2":"value2",...}... (450 characters)
→
{"key1":"newValue1","key2":"newValue2",...}... (475 characters)
```

**Huge Objects (>1000 nodes or depth >20):**

```tsx
// Deeply nested or very large object
const hugeConfig = {
  /* thousands of nested properties */
};
```

**Output:**

```
│   Prop change config: [Too large object to render. >1000 nodes] → [Too large object to render. >1000 nodes]
```

**Note:** Objects are checked before serialization. If they exceed limits (>1000 nodes or depth >20), they're replaced with the truncation message to prevent performance issues.

**Function Changes:**

```tsx
// Different function reference
onClick={() => handleClick(1)}  // becomes
onClick={() => handleClick(2)}
```

**Output:**

```
│   Prop change onClick: (fn:9) → (fn:10)
```

---

### 7. State Change Detection (Update)

**When:** A tracked component re-renders and state has changed.

**Input (User Code):**

```tsx
// @trace
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(5);
  }, []);

  return <div>{count}</div>;
};
```

**Expected Output (on second render):**

```
Component render cycle 2:
├─ [Counter] Rendering ⚡
│   State change count: 0 → 5
```

**Detection Logic:**

- Component is tracked
- Hook chain traversed from `fiber.memoizedState`
- Compare current `hook.memoizedState` with previous value
- Previous value obtained from:
  - `hook.queue.lastRenderedState` (for useState)
  - Saved previous labels snapshot (for labeled custom hooks)
- State variables resolved via hook labels

---

### 8. State Change Output Formatting

**Primitive Changes:**

```tsx
setCount(5); // from 0
```

**Output:**

```
│   State change count: 0 → 5
```

**Object Changes:**

```tsx
setUser({ id: 2, name: "Bob" }); // from { id: 1, name: "Alice" }
```

**Output:**

```
│   State change user:
{"id":1,"name":"Alice"}
→
{"id":2,"name":"Bob"}
```

**Array Changes:**

```tsx
setItems([4, 5, 6]); // from [1, 2, 3]
```

**Output:**

```
│   State change items: [1,2,3] → [4,5,6]
```

**Function State Changes:**

```tsx
// Functions are compared by reference equality only
const [callback, setCallback] = useState(() => fn1);

// Later, if a different function reference is set:
setCallback(() => fn2);
```

**Output (if reference changes - different function):**

```
│   State change callback: (fn:11) → (fn:12)
```

**Output (if reference is same - same function):**

```
(no output - no change detected)
```

**Note:** Functions are **always compared by reference**:

- Same reference = no change, no output
- Different reference = change detected, output shows `(fn:N1) → (fn:N2)`
- There is no "deep equality" or "identical value" concept for functions

---

## Special Cases

### Identical Value Changes (Warning)

**When:** `detectIdenticalValueChanges` option is enabled and a state/prop change has a different reference but deep-equal value.

**Input:**

```tsx
const [data, setData] = useState({ id: 1, name: "test" });

// Later, create new object with same values
setData({ id: 1, name: "test" });
```

**Output:**

```
Component render cycle 2:
├─ [MyComponent] Rendering ⚡
│   ⚠️ State change data (identical value):
{"id":1,"name":"test"}
→
{"id":1,"name":"test"}
```

**Note:** Functions should NEVER be marked as identical value changes because:

- Same function reference = no change detected
- Different function reference = different identity (fn:N vs fn:M)

---

### Unlabeled State Detection

**When:** A tracked component uses useState but no labels are provided.

**Input:**

```tsx
// @trace
const MyComponent: React.FC = () => {
  const [count] = useState(0); // No label injected
  return <div>{count}</div>;
};
```

**Expected Output:**

```
Component render cycle 1:
├─ [MyComponent] Mount ⚡
│   Initial state unknown: 0
```

**Note:** State changes for unlabeled hooks are still detected but show as "unknown" (no brackets).

---

### Partial Label Coverage (Ordinal Disambiguation)

**When:** Multiple state hooks have the same value, but only some are labeled. The system uses ordinal constraints to narrow down possibilities.

**Input:**

```tsx
// @trace
const TodoList: React.FC = () => {
  const [filteredTodos, setFilteredTodos] = useState([]); // Labeled at index 0
  const [unknownTodos] = useState([]); // Not labeled
  const [completedTodos, setCompletedTodos] = useState([]); // Labeled at index 2

  // All three have the same value: []
  return <div>...</div>;
};
```

**Expected Output (showing ordinal constraints):**

```
Component render cycle 1:
├─ [TodoList] Mount ⚡
│   Initial state filteredTodos | unknown: []
│   Initial state filteredTodos | completedTodos | unknown: []
│   Initial state completedTodos | unknown: []
│   Initial state setFilteredTodos: (fn:10)
│   Initial state setCompletedTodos: (fn:11)
```

**Explanation:**

- **First `[]`**: Could be `filteredTodos` (source order position 0) or the unlabeled hook → `filteredTodos | unknown`
- **Second `[]`**: Could be any of the three hooks → `filteredTodos | completedTodos | unknown`
- **Third `[]`**: Could be `completedTodos` (must come after `filteredTodos`) or unlabeled → `completedTodos | unknown`

**Note:** The system maintains relative source order - `filteredTodos` always appears before `completedTodos` in the unions because that's their order in the code. This helps developers identify which hook is which.

---

### Custom Hook Detection (with Labels)

**When:** A custom hook returns multiple values and babel plugin injects labels.

**Input:**

```tsx
// In custom hook
const useCounter = () => {
  const [count, setCount] = useState(0);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
};

// @trace
const MyComponent: React.FC = () => {
  const { count, increment } = useCounter();
  return <button onClick={increment}>{count}</button>;
};
```

**Expected Output (with babel plugin):**

```
Component render cycle 1:
├─ [MyComponent] Mount ⚡
│   Initial state count: 0
│   Initial state increment: (fn:13)
```

**Output on Update:**

```
Component render cycle 2:
├─ [MyComponent] Rendering ⚡
│   State change count: 0 → 1
```

---

## Summary Table

| Scenario                | When              | Detection Method                              | Output Format                                   |
| ----------------------- | ----------------- | --------------------------------------------- | ----------------------------------------------- |
| Initial Props           | Mount             | No alternate fiber                            | `Initial prop <name>: <value>`                  |
| Initial State           | Mount             | Hook chain + labels                           | `Initial state <name>: <value>`                 |
| Prop Changes            | Update            | Compare with alternate.memoizedProps          | `Prop change <name>: <before> → <after>`        |
| State Changes           | Update            | Compare with lastRenderedState or prev labels | `State change <name>: <before> → <after>`       |
| Identical Value Warning | Update (optional) | Deep equality check                           | `⚠️ State change <name> (identical value): ...` |

---

## Function Identity Rules

1. **Same function reference across renders:**

   - No change detected
   - No output

2. **Different function reference:**

   - Change detected
   - Output: `(fn:N) → (fn:M)` where N ≠ M

3. **Functions never marked as identical:**

   - Even if code is the same, different instances get different IDs
   - No "(identical value)" warning for functions

4. **Function IDs are stable:**
   - Same function reference always gets same ID within a session
   - IDs increment globally across all components

---

## Formatting Details

### Truncation Rules

- **<20 chars total:** Single line `before → after`
- **20-200 chars:** Multi-line with full values
- **>200 chars:** Multi-line with truncated values and character counts

### Value Serialization

- **Primitives:** `String(value)`
- **Functions:** `(fn:ID)` via `getFunctionId()`
- **Objects/Arrays:** `safeStringify(value, functionReplacer)` with:
  - Stable alphabetical key ordering
  - Circular reference handling
  - Depth limit: 10
  - Breadth limit: 50

### Skipped Props

**Always skipped (React internals):**

- `children`
- `key`
- `ref`
- `__self`
- `__source`

**Configurable skips (per component):**

- Material-UI: `theme`, `sx`, `className`, `ownerState`, `as`, `component`
- Can be extended via `skippedProps` configuration

---

## Component Visibility Settings

### Overview

The auto-tracer provides fine-grained control over which components appear in the console tree output. **Tracked components** (marked with ⚡) are **always visible** regardless of these settings. These visibility options control **non-tracked components only**.

### Visibility Type Definition

```typescript
/**
 * Controls visibility of non-tracked components in the tree.
 * Tracked components are ALWAYS visible regardless of these settings.
 */
type NonTrackedComponentVisibility =
  | "never" // Never show, even if has props/state
  | "forProps" // Show only if has initial props or prop changes
  | "forState" // Show only if has initial state or state changes
  | "forPropsOrState" // Show if has any props or state
  | "always"; // Always show
```

### Visibility Options

Four settings control different component lifecycle events:

- **`includeReconciled`**: Controls components in "Reconciled" state (React compared but didn't update)
- **`includeSkipped`**: Controls components that were skipped during reconciliation
- **`includeMount`**: Controls components mounting for the first time
- **`includeRendered`**: Controls components re-rendering (update phase)

### Default Values

```typescript
{
  includeReconciled: "never",  // Hide reconciled non-tracked components
  includeSkipped: "never",     // Hide skipped non-tracked components
  includeMount: "never",       // Hide mount of non-tracked components
  includeRendered: "never",    // Hide renders of non-tracked components
}
```

**Result**: Out of the box, users see **only their tracked components**. This provides a clean, focused output showing only the components explicitly marked for tracking.

### User Personas and Recommended Settings

#### Persona 1: "Just My Code" (Default - Most Users)

**Goal**: Only see tracked components, everything else is noise

**Settings**:

```typescript
{
  includeReconciled: "never",
  includeSkipped: "never",
  includeMount: "never",
  includeRendered: "never",
}
```

**Example Output**:

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [TodoList] Rendering ⚡
  │   State change filteredTodos: []→[{...}]
  │   State change loading: true → false
  └─┐ ... (14 levels collapsed)
    ├─ [TodoItem] Mount ⚡
    │   Initial state dispatch: (fn:3)
    │   Initial prop todo: {...}
```

Only tracked components visible, all framework/library components hidden.

#### Persona 2: "Show Me Interesting Stuff" (Curious Users)

**Goal**: See tracked components plus non-tracked components that have meaningful changes

**Settings**:

```typescript
{
  includeReconciled: "forPropsOrState",
  includeSkipped: "forPropsOrState",
  includeMount: "forPropsOrState",
  includeRendered: "forPropsOrState",
}
```

**Example Output**:

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [TodoList] Rendering ⚡
  │   State change filteredTodos: []→[{...}]
  │   State change loading: true → false
  └─┐ ... (1 levels collapsed)
    ├─ [Styled(div)] Rendering
    │   Prop change sx: {...}→{}
    └─┐
      ├─ [Insertion6] Rendering
      │   Prop change serialized: {...}→{...}
      ├─ [div] Rendering
      │   Prop change className: MuiBox-root css-qd5mg9→MuiBox-root css-0
      └─┐
        ├─ [Box4] Mount
        │   Initial prop display: flex
        │   Initial prop justifyContent: space-between
        ...
        └─┐ ... (3 levels collapsed)
          ├─ [TodoItem] Mount ⚡
```

Shows tracked components plus library components that receive prop/state changes.

#### Persona 3: "I Want Everything" (Deep Debuggers)

**Goal**: See the complete React fiber tree structure, accept performance impact

**Settings**:

```typescript
{
  includeReconciled: "always",
  includeSkipped: "always",
  includeMount: "always",
  includeRendered: "always",
}
```

**Example Output**:

```
Component render cycle 1:
├─ [App] Mount
└─┐
  ├─ [ThemeProvider] Mount
  └─┐
    ├─ [Unknown] Mount
    └─┐
      ├─ [CssBaseline] Mount
      ├─ [Provider] Mount
      └─┐
        ├─ [Unknown] Mount
        └─┐
          ├─ [RouterProvider] Mount
          └─┐
            ├─ [Layout] Mount
            └─┐
              ├─ [Styled(div)] Mount
              └─┐
                ├─ [div] Mount
                └─┐
                  ├─ [Header] Mount
                  └─┐
                    ├─ [Navigation] Mount
                    └─┐
                      ├─ [nav] Mount
                      └─┐
                        ├─ [MyTrackedComponent] Mount ⚡
                        │   Initial state count: 0
```

Full tree visible, helpful for understanding React internals and reconciliation.

### Visibility Filter Values Explained

#### `"never"`

Hides the component entirely, even if it has props/state changes.

**Use case**: You never want to see this category of events, even in ancestor chains.

**Example**: Hide all reconciled events:

```typescript
{
  includeReconciled: "never";
}
```

#### `"forProps"`

Shows the component only if it has:

- Initial props (on mount)
- Prop changes (on update)

**Use case**: Track data flow through props.

**Example with `includeRendered: "forProps"`**:

```
Component render cycle 1:
├─ [TodoList] Rendering ⚡       # Tracked, always shown
└─┐
  ├─ [Styled(div)] Rendering    # Shown: has prop change
  │   Prop change sx: {...}→{}
  └─┐ ... (5 levels collapsed)  # Hidden: no props
    ├─ [TodoItem] Mount ⚡       # Tracked, always shown
```

#### `"forState"`

Shows the component only if it has:

- Initial state (on mount)
- State changes (on update)

**Use case**: Track local state management in non-tracked components.

**Example with `includeRendered: "forState"`**:

```
Component render cycle 1:
├─ [TodoList] Rendering ⚡           # Tracked, always shown
└─┐ ... (10 levels collapsed)       # Hidden: no state
  ├─ [InternalCounter] Rendering    # Shown: has state change
  │   State change count: 0 → 1
  └─┐ ... (3 levels collapsed)
    ├─ [TodoItem] Mount ⚡           # Tracked, always shown
```

#### `"forPropsOrState"`

Shows the component if it has any of:

- Initial props or state (on mount)
- Prop or state changes (on update)

**Use case**: Most common setting for curious users - show anything with meaningful data.

**Example with `includeRendered: "forPropsOrState"`**:

```
Component render cycle 1:
├─ [TodoList] Rendering ⚡           # Tracked, always shown
└─┐
  ├─ [Styled(div)] Rendering        # Shown: has props
  │   Prop change sx: {...}→{}
  ├─ [InternalCounter] Rendering    # Shown: has state
  │   State change count: 0 → 1
  └─┐ ... (2 levels collapsed)      # Hidden: no props/state
    ├─ [TodoItem] Mount ⚡           # Tracked, always shown
```

#### `"always"`

Always shows the component regardless of content.

**Use case**: Full visibility mode for deep debugging.

### Interaction with `filterEmptyNodes`

The visibility settings and `filterEmptyNodes` work together:

1. **Visibility filtering** (first pass): Determines which components appear based on tracking status and content
2. **Empty node collapsing** (second pass): Collapses sequences of nodes without changes

**Example with both**:

```typescript
{
  includeRendered: "forPropsOrState",  // Show only non-tracked with props/state
  filterEmptyNodes: "all",              // Collapse empty sequences
}
```

**Result**:

- Non-tracked components without props/state are filtered by visibility
- Remaining nodes without changes are collapsed by `filterEmptyNodes`
- Double-filtering creates the most compact output

### Empty Node Definition (Updated)

An **empty node** is a component that:

- Has no state changes
- Has no prop changes
- Has no component logs
- Is not tracked (no `trackingGUID`)
- Has no identical value warnings
- Is hidden by visibility settings (when `includeReconciled/Skipped/Mount/Rendered` is not `"always"`)

---

## Render Cycle Counter

### Overview

Each component render cycle is numbered sequentially to help track component re-render frequency. The counter increments globally across all components in the application.

### Format

**Standard format (no filtered cycles):**

```
Component render cycle N:
```

Where `N` is the total number of render cycles that have occurred.

**Format with filtered cycles:**

```
Component render cycle N (M filtered):
```

Where:

- `N` = Total number of render cycles that have occurred
- `M` = Number of render cycles since the last displayed cycle that were filtered from display due to visibility settings

### Examples

**Initial render:**

```
Component render cycle 1:
├─ [TodoList] Mount ⚡
```

**Subsequent renders with no filtering:**

```
Component render cycle 2:
├─ [TodoList] Rendering ⚡
│   State change items: [] → [{...}]
```

**Renders with filtered cycles:**

```
Component render cycle 5 (2 filtered):
├─ [TodoList] Rendering ⚡
│   State change loading: true → false
```

This indicates:

- 5 total render cycles have occurred
- Cycles 3 and 4 were filtered from display (had no visible components based on current settings)
- This is the first cycle shown since cycle 2

### Filtering Scenarios

**Scenario 1: All cycles visible**

```
Component render cycle 1:
├─ [App] Mount ⚡

Component render cycle 2:
├─ [App] Rendering ⚡

Component render cycle 3:
├─ [TodoList] Mount ⚡
```

**Scenario 2: Some cycles filtered (default visibility settings)**

```
Component render cycle 1:
├─ [App] Mount ⚡

Component render cycle 5 (3 filtered):
├─ [TodoList] Rendering ⚡
│   State change items: [] → [{...}]
```

Cycles 2-4 had no tracked components that met visibility criteria, so they were filtered from display.

**Scenario 3: Many cycles filtered**

```
Component render cycle 1:
├─ [App] Mount ⚡

Component render cycle 47 (45 filtered):
├─ [DeepComponent] Rendering ⚡
│   Prop change value: 1 → 2
```

This pattern is common in applications with frequent React reconciliation but infrequent changes to tracked components.

### Implementation Notes

- Counter increments at the start of each render cycle (when `detectUpdatedComponents` is called)
- Filtered count tracks cycles since the last cycle that produced visible output
- Counter persists across the entire application session
- Counter resets only when the page reloads or the AutoTracer instance is recreated

---

## Tree Rendering and Filter Modes

### Filter Modes Overview

The `filterEmptyNodes` option controls how "empty" nodes are displayed in the console tree output after visibility filtering has been applied.

### Filter Mode: `none` (Default)

**Behavior:**

- No filtering applied
- All nodes that pass visibility settings appear in the tree
- Identity function with zero performance overhead

**When to use:**

- With default visibility settings (`"never"`): See only tracked components with full tree structure preserved
- With `"always"` visibility: See complete React fiber tree
- When you want to see the exact structure without collapsing

**Example Output (with default visibility `"never"`):**

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [MyTrackedComponent] Mount ⚡
  │   Initial state count: 0
  └─┐ ... (14 levels collapsed)
    ├─ [AnotherTrackedComponent] Rendering ⚡
    │   State change value: 0 → 5
```

**Example Output (with visibility set to `"always"`):**

```
Component render cycle 1:
├─ [App] Mount
└─┐
  ├─ [ThemeProvider] Mount
  └─┐
    ├─ [Unknown] Mount
    └─┐
      ├─ [CssBaseline] Mount
      ├─ [Provider] Mount
      └─┐
        ├─ [Unknown] Mount
        └─┐
          ├─ [RouterProvider] Mount
          └─┐
            ├─ [Layout] Mount
            └─┐
              ├─ [Styled(div)] Mount
              └─┐
                ├─ [div] Mount
                └─┐
                  ├─ [Header] Mount
                  └─┐
                    ├─ [Navigation] Mount
                    └─┐
                      ├─ [nav] Mount
                      └─┐
                        ├─ [MyTrackedComponent] Mount ⚡
                        │   Initial state count: 0
```

**Note:** The `filterEmptyNodes` setting works **after** visibility filtering. With default visibility (`"never"`), most non-tracked components are already hidden, so `filterEmptyNodes: "none"` simply preserves the depth markers.

### Filter Mode: `first`

**Behavior:**

- Collapses **only** the initial sequence of empty nodes at the start of the tree
- Replaces consecutive empty nodes with a single marker node
- All empty nodes appearing after the first non-empty node remain visible
- Single-pass algorithm with O(n) complexity

**When to use:**

- With `"always"` visibility: Clean up top-level wrapper components (providers, themes, routers)
- Still need full visibility deeper in the tree
- Balanced approach between clarity and completeness

**Example Output (with visibility set to `"always"`):**

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [MyTrackedComponent] Mount ⚡
  │   Initial state count: 0
  └─┐
    ├─ [ChildWrapper] Mount
    ├─ [Unknown] Mount
    └─┐
      ├─ [Styled(section)] Mount
      └─┐
        ├─ [section] Mount
        └─┐
          ├─ [AnotherWrapper] Mount
          └─┐
            ├─ [div] Mount
            └─┐
              ├─ [DeepComponent] Rendering ⚡
              │   State change value: 0 → 5
```

**Note:** With default visibility (`"never"`), this mode has minimal impact since non-tracked components are already filtered. The `first` mode is most useful when visibility is set to `"always"` or `"forPropsOrState"` and you want to clean up the initial wrapper noise.

### Filter Mode: `all`

**Behavior:**

- Collapses **all** empty node sequences throughout the entire tree
- Each sequence of consecutive empty nodes becomes a marker
- Provides the most compact view by removing all noise
- Single-pass algorithm with O(n) complexity

**When to use:**

- Maximum clarity - only show components with actual changes or logs
- Works well with both default visibility (`"never"`) and `"forPropsOrState"`
- Reducing console noise in large applications

**Example Output (with default visibility `"never"`):**

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [MyTrackedComponent] Mount ⚡
  │   Initial state count: 0
  └─┐ ... (14 levels collapsed)
    ├─ [DeepComponent] Rendering ⚡
    │   State change value: 0 → 5
    └─┐ ... (8 levels collapsed)
      ├─ [FinalComponent] Rendering ⚡
      │   Prop change title: Hello → World
```

**Example Output (with visibility set to `"forPropsOrState"`):**

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [MyTrackedComponent] Mount ⚡
  │   Initial state count: 0
  └─┐ ... (1 levels collapsed)
    ├─ [Styled(div)] Rendering
    │   Prop change sx: {...}→{}
    └─┐ ... (2 levels collapsed)
      ├─ [Box4] Mount
      │   Initial prop display: flex
      └─┐ ... (3 levels collapsed)
        ├─ [DeepComponent] Rendering ⚡
        │   State change value: 0 → 5
```

**Note:** With default visibility, `all` mode provides the cleanest output by collapsing all non-tracked components between your tracked components. With `"forPropsOrState"` visibility, it collapses only the nodes without props/state changes.

---

## Empty Level Marker Calculation

### Standard Mode (Default Output)

**Format:** `... (N levels collapsed)`

**Calculation:**

1. Calculate the difference in **real depth** between the current node and the visible parent node
2. This shows the depth gap in the React fiber tree, not the number of nodes filtered
3. Display uses plural "levels" regardless of count

**Examples:**

```
... (1 levels collapsed)  # Current node is 1 level deeper than visible parent
... (7 levels collapsed)  # Current node is 7 levels deeper than visible parent
... (21 levels collapsed) # Current node is 21 levels deeper than visible parent
```

**Implementation:**

```typescript
const depthDifference = currentNodeRealDepth - visibleParentRealDepth;
const text = `... (${depthDifference} levels collapsed)`;
```

**Note:** This accurately represents the depth gap in the React fiber tree structure, making it clear how many levels of nesting exist between visible nodes.

### Internal Debug Mode

**Format:** `... (Level: N, Filtered nodes: M)`

**When enabled:** Set `enableAutoTracerInternalsLogging: true` in options

**Calculation:**

1. **Level (N):** The **original real depth** (zero-based) of the **next visible node** (the current node being displayed after the collapse)
2. **Filtered nodes (M):** Count of nodes filtered away since the previous visible node

**Examples:**

```
└─┐ ... (Level: 5, Filtered nodes: 5)   # Next visible at depth 5, filtered 5 nodes since parent at depth 0
  ├─ [MyComponent] Mount ⚡               # This component is at depth 5
  └─┐ ... (Level: 10, Filtered nodes: 4) # Next visible at depth 10, filtered 4 nodes since MyComponent at depth 5
    ├─ [DeepComponent] Mount ⚡           # This component is at depth 10
```

**Key difference:**

- Standard mode: Shows **depth difference** (levels of nesting between visible nodes)
- Debug mode: Shows **absolute depth** and **node count** filtered (detailed debugging info)

---

## Visual Depth vs Original Depth

### Original Depth

- The actual depth in React's fiber tree
- Zero-based (root is depth 0)
- Never changes regardless of filtering
- Used in debug mode markers: `... (Level: N)`

### Visual Depth

- The indentation level in the console output
- Adjusted based on filter mode and tree structure
- Controls how many spaces indent each line
- Calculated dynamically during rendering

**Example with filtering:**

```
Original depth:  Visual depth:
0                0     └─┐ ... (4 levels collapsed)
1                      (collapsed: Unknown)
2                      (collapsed: ThemeProvider)
3                      (collapsed: div)
4                      (collapsed: Styled(section))
5                1       ├─ [MyComponent] Mount ⚡
6                2       └─┐
7                2         ├─ [div] Mount
8                3         └─┐
9                4           ├─ [ChildComponent] Mount
```

---

## Connector Display Logic

### Depth Transitions

When a node is deeper than the previous node, connecting lines show the hierarchy:

```
Component render cycle 1:
├─ [Parent] Mount
└─┐
  ├─ [Child] Mount
  └─┐
    ├─ [GrandChild] Mount
```

### With Markers

When a marker is present (with `filterEmptyNodes: 'first'` or `'all'`), intermediate connectors are skipped since the marker already represents those levels:

**With default visibility (`"never"`) and `filterEmptyNodes: 'all'`:**

```
Component render cycle 1:
└─┐ ... (21 levels collapsed)
  ├─ [DeepComponent] Mount ⚡
  └─┐ ... (10 levels collapsed)
    ├─ [AnotherTracked] Rendering ⚡
```

**With visibility set to `"always"` and `filterEmptyNodes: 'all'`:**

```
Component render cycle 1:
└─┐ ... (1 levels collapsed)
  ├─ [Unknown] Mount
  └─┐ ... (1 levels collapsed)
    ├─ [div] Mount
    └─┐ ... (1 levels collapsed)
      ├─ [Styled(div)] Mount
      └─┐ ... (1 levels collapsed)
        ├─ [Unknown] Mount
        └─┐ ... (1 levels collapsed)
          ├─ [DeepComponent] Mount ⚡
```

**Note:** With `'all'` mode and `"always"` visibility, empty nodes between every visible node are collapsed. Mount nodes remain visible but empty nodes between them show as "1 levels collapsed" markers.

**Without filtering (filterEmptyNodes: 'none') and visibility `"always"` - same structure:**

```
Component render cycle 1:
└─┐
  └─┐
    ├─ [Unknown] Mount
    └─┐
      └─┐
        ├─ [div] Mount
        └─┐
          └─┐
            ├─ [Styled(div)] Mount
            └─┐
              └─┐
                ├─ [Unknown] Mount
                └─┐
                  └─┐
                    ├─ [DeepComponent] Mount ⚡
```

**Note:** Each pair of `└─┐` lines represents an empty node in the React fiber tree. The double connector pattern shows the verbosity that filtering is designed to eliminate.

### Debug Mode Connectors

With `enableAutoTracerInternalsLogging: true`, markers show the absolute depth and node count:

```
Component render cycle 1:
├─ [Parent] Mount
└─┐ ... (Level: 3, Filtered nodes: 2)
  ├─ [Child] Mount
  └─┐ ... (Level: 7, Filtered nodes: 12)
    ├─ [DeepChild] Mount
```

**Explanation:**

- **Parent** is at depth 0
- **First marker**: `Child` is at depth 3, and 2 nodes (at depths 1-2) were filtered since `Parent`
- **Second marker**: `DeepChild` is at depth 7, and 12 nodes (at depths 4-6) were filtered since `Child`
  - This demonstrates that multiple nodes can exist at the same depth level (e.g., 4 nodes at depth 4, 5 nodes at depth 5, and 3 nodes at depth 6 = 12 total filtered nodes across 3 depth levels)

---

## Performance Characteristics

| Mode    | Time Complexity | Memory        | Use Case                              |
| ------- | --------------- | ------------- | ------------------------------------- |
| `none`  | O(1)            | Zero overhead | Complete visibility, debugging        |
| `first` | O(n)            | Minimal       | Clean top wrappers, keep full tree    |
| `all`   | O(n)            | Minimal       | Maximum clarity, production debugging |

**Notes:**

- `n` is the number of nodes in the tree
- All modes use single-pass algorithms
- Filtering happens after tree construction
- Markers reuse the same depth as the first collapsed node

---

## Recommended Settings Combinations

### Default Configuration (Out of the Box)

```typescript
{
  includeReconciled: "never",
  includeSkipped: "never",
  includeMount: "never",
  includeRendered: "never",
  filterEmptyNodes: "none",
}
```

**Result**: Only tracked components visible with depth markers showing their position in the tree.

**Best for**: Most users who only care about their own components.

### Curious Developer Configuration

```typescript
{
  includeReconciled: "forPropsOrState",
  includeSkipped: "forPropsOrState",
  includeMount: "forPropsOrState",
  includeRendered: "forPropsOrState",
  filterEmptyNodes: "all",
}
```

**Result**: Tracked components plus non-tracked components with props/state changes, with all empty nodes collapsed.

**Best for**: Understanding how your tracked components interact with library/framework components.

### Full Debug Configuration

```typescript
{
  includeReconciled: "always",
  includeSkipped: "always",
  includeMount: "always",
  includeRendered: "always",
  filterEmptyNodes: "none",
}
```

**Result**: Complete React fiber tree with full structural detail.

**Best for**: Deep debugging, understanding React's reconciliation process, or investigating unexpected behavior.

### Minimalist Configuration

```typescript
{
  includeReconciled: "never",
  includeSkipped: "never",
  includeMount: "never",
  includeRendered: "never",
  filterEmptyNodes: "all",
}
```

**Result**: Only tracked components with maximum collapse of intermediate nodes.

**Best for**: Production debugging or applications with very deep component trees.

---

## Migration Guide

### Breaking Change in v2.0

Prior to v2.0, the default visibility settings were effectively `"always"`, showing all components in the tree. Starting with v2.0, the defaults are `"never"`, showing only tracked components.

**To restore previous behavior**, use:

```typescript
const autoTracer = new AutoTracer({
  includeReconciled: "always",
  includeSkipped: "always",
  includeMount: "always",
  includeRendered: "always",
});
```

**Why this change?**

User research showed that most developers are only interested in their own tracked components. Library and framework components (Material-UI, React Router, etc.) create significant noise in the output, making it harder to focus on application-specific behavior. The new defaults provide a cleaner, more focused debugging experience.

---

## End of Specification
