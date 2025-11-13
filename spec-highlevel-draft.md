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
├─ [MyComponent] Mount ⚡
│   Initial state count: 0
│   Initial state increment: (fn:13)
```

**Output on Update:**

```
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

## Tree Rendering and Filter Modes

### Filter Modes Overview

The `filterEmptyNodes` option controls how "empty" nodes are displayed in the console tree output. An **empty node** is a component that renders without meaningful content:

- No state changes
- No prop changes
- No component logs
- Not tracked (no `trackingGUID`)
- No identical value warnings
- Optionally hidden by visibility settings (Reconciled/Skipped when those flags are disabled)

### Filter Mode: `none` (Default)

**Behavior:**

- No filtering applied
- All nodes appear in the tree regardless of whether they have content
- Identity function with zero performance overhead

**When to use:**

- Need complete visibility into the entire component hierarchy
- Debugging React's reconciliation process
- Understanding component structure and nesting

**Example Output:**

```
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

### Filter Mode: `first`

**Behavior:**

- Collapses **only** the initial sequence of empty nodes at the start of the tree
- Replaces consecutive empty nodes with a single marker node
- All empty nodes appearing after the first non-empty node remain visible
- Single-pass algorithm with O(n) complexity

**When to use:**

- Want to clean up top-level wrapper components (providers, themes, routers)
- Still need full visibility deeper in the tree
- Balanced approach between clarity and completeness

**Example Output:**

```
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

**Note:** The marker `... (21 levels collapsed)` indicates the tracked component is 21 levels deeper than the root. With `first` mode, the noise reappears deeper in the tree.

### Filter Mode: `all`

**Behavior:**

- Collapses **all** empty node sequences throughout the entire tree
- Each sequence of consecutive empty nodes becomes a marker
- Provides the most compact view by removing all noise
- Single-pass algorithm with O(n) complexity

**When to use:**

- Maximum clarity - only show components with actual changes or logs
- Production debugging where you only care about meaningful renders
- Reducing console noise in large applications

**Example Output:**

```
└─┐ ... (21 levels collapsed)
  ├─ [MyTrackedComponent] Mount ⚡
  │   Initial state count: 0
  └─┐ ... (3 levels collapsed)
    ├─ [DeepComponent] Rendering ⚡
    │   State change value: 0 → 5
    └─┐ ... (5 levels collapsed)
      ├─ [FinalComponent] Rendering ⚡
      │   Prop change title: Hello → World
```

**Note:** All sequences of empty nodes (Unknown, HTML elements, wrappers without changes) are collapsed, showing the depth difference between visible nodes.

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
├─ [Parent] Mount
└─┐
  ├─ [Child] Mount
  └─┐
    ├─ [GrandChild] Mount
```

### With Markers

When a marker is present (with `filterEmptyNodes: 'first'` or `'all'`), intermediate connectors are skipped since the marker already represents those levels:

**With `filterEmptyNodes: 'all' or 'first'` and `includeMount: false`:**

```
└─┐ ... (10 levels collapsed)
  ├─ [DeepComponent] Mount ⚡
```

**With `filterEmptyNodes: 'all'` and `includeMount: true`:**

```
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

**Note:** With `'all'` mode, empty nodes between every visible node are collapsed. With `includeMount: true`, Mount nodes remain visible but empty nodes between them show as "1 levels collapsed" markers.

**Without filtering (filterEmptyNodes: 'none') - same structure:**

```
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

## End of Specification
