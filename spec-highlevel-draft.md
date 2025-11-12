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
const MyComponent: React.FC<{ name: string; count: number }> = ({ name, count }) => {
  return <div>{name}: {count}</div>;
};

// Usage
<MyComponent name="Alice" count={5} />
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
const Button: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => {
  return <button onClick={onClick}>{label}</button>;
};

// Usage
<Button onClick={() => console.log('clicked')} label="Submit" />
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
const UserCard: React.FC<{ user: { id: number; name: string } }> = ({ user }) => {
  return <div>{user.name}</div>;
};

// Usage
<UserCard user={{ id: 1, name: "Bob" }} />
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

  return <div>{name}: {count}</div>;
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
const hugeConfig = { /* thousands of nested properties */ };
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
setCount(5);  // from 0
```

**Output:**
```
│   State change count: 0 → 5
```

**Object Changes:**
```tsx
setUser({ id: 2, name: "Bob" });  // from { id: 1, name: "Alice" }
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
setItems([4, 5, 6]);  // from [1, 2, 3]
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
  const [count] = useState(0);  // No label injected
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
  const [filteredTodos, setFilteredTodos] = useState([]);  // Labeled at index 0
  const [unknownTodos] = useState([]);                     // Not labeled
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
  const increment = () => setCount(c => c + 1);
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

| Scenario | When | Detection Method | Output Format |
|----------|------|------------------|---------------|
| Initial Props | Mount | No alternate fiber | `Initial prop <name>: <value>` |
| Initial State | Mount | Hook chain + labels | `Initial state <name>: <value>` |
| Prop Changes | Update | Compare with alternate.memoizedProps | `Prop change <name>: <before> → <after>` |
| State Changes | Update | Compare with lastRenderedState or prev labels | `State change <name>: <before> → <after>` |
| Identical Value Warning | Update (optional) | Deep equality check | `⚠️ State change <name> (identical value): ...` |

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

## End of Specification
