# State Name Resolution v3: Value-Based Matching with Ordinal Disambiguation

> **Status: Design Proposal - Not Implemented**

## Executive Summary

This document describes the complete solution for fixing the "stateN" fallback issue in the auto-tracer library. The root cause is that labels are stored using build-time indices but retrieved using runtime target indices from pattern matching—two completely different index spaces. The solution uses **value-based matching with ordinal disambiguation** to correctly resolve friendly labels like "filteredTodos" instead of generic "stateN".

## The Problem

### Current Implementation Flaw

**Storage (Build-time)**:

```typescript
// Injected code
const filteredTodos = useAppSelector(selectFilteredTodos);
logger.labelState("filteredTodos", 0); // Stored at index 0
const loading = useAppSelector(selectTodosLoading);
logger.labelState("loading", 1); // Stored at index 1
```

**Retrieval (Runtime)**:

```typescript
// Pattern matching finds runtime target indices: 9, 10, 11, 12
const label = resolveHookLabel(guid, 9); // Tries to get label at index 9
// But labels are stored at 0, 1, 2, 3 → lookup fails → "state9"
```

### Root Cause

Build-time indices (0, 1, 2, 3...) count only labeled hooks in source order, while runtime target indices (9, 10, 11, 12...) are positions in React's `_debugHookTypes` array that includes ALL hooks. These index spaces are fundamentally different and cannot be aligned without runtime knowledge.

## The Solution: Value-Based Matching

### Core Concept

Instead of matching by index, match by **value** (the actual state data). Since labels are cleared and recreated every render, we can safely include the current value in the label registry and use it as the primary matching key.

### Matching Strategy

The matching strategy must account for three scenarios:

#### Scenario 1: Unique Value (Perfect Match)

```typescript
// Fiber state:
// anchor 1: filteredTodos = []  (labeled)
// anchor 2: loading = false     (labeled)
// anchor 3: count = 42          (unlabeled)

// All values are unique → direct match by value
// Result (showing value changes):
// "filteredTodos changed: [{id: 1, text: 'Buy milk', completed: false}] -> []"
// "loading changed: true -> false"
// "state3 changed: 41 -> 42"
```

#### Scenario 2: Duplicate Value, All Labeled (Ordinal Match)

```typescript
// Fiber state:
// anchor 1: filteredTodos = []      (labeled "filteredTodos")
// anchor 2: completedTodos = []     (labeled "completedTodos")
// anchor 3: archivedTodos = []      (labeled "archivedTodos")

// Same value [], but ALL occurrences are labeled → match by ordinal position
// First [] → "filteredTodos", Second [] → "completedTodos", Third [] → "archivedTodos"
// Result (showing value changes):
// "filteredTodos changed: [{id: 1, text: 'Buy milk', completed: false}] -> []"
// "completedTodos changed: [{id: 2, text: 'Walk dog', completed: true}, {id: 3, text: 'Read book', completed: true}] -> []"
// "archivedTodos changed: [] -> []"  // No change, just showing format
```

#### Scenario 3: Duplicate Value, Partial Labels (Ordinal Constraints)

```typescript
// Labels registered (build-time order):
// index 0: "filteredTodos" with value []
// index 2: "completedTodos" with value []

// Fiber state (runtime - 3 anchors, but only 2 labels):
// anchor 1: []  (could be: filteredTodos OR unknown)
// anchor 2: []  (could be: filteredTodos OR completedTodos OR unknown)
// anchor 3: []  (could be: completedTodos OR unknown)

// We KNOW the relative order of labeled hooks:
// "filteredTodos" comes BEFORE "completedTodos" in source order

// Ordinal constraints narrow down possibilities:
// - anchor 1: Can't be completedTodos (must come after filteredTodos)
//             → "filteredTodos | unknown"
// - anchor 2: Could be either labeled hook or the unlabeled one
//             → "filteredTodos | completedTodos | unknown"
// - anchor 3: Can't be filteredTodos (must come before completedTodos)
//             → "completedTodos | unknown"

// Result:
// "filteredTodos | unknown changed: [{id: 1, text: 'Buy milk', completed: false}] -> []"
// "filteredTodos | completedTodos | unknown changed: [{id: 2, text: 'Walk dog', completed: true}, {id: 3, text: 'Read book', completed: true}] -> []"
// "completedTodos | unknown changed: [] -> []"
```

**Key Insight**: Even when we can't fully disambiguate, we can use the **ordinal positions** of labeled hooks to constrain which labels are possible for each anchor. A label at build-time index N can only match a runtime anchor if there are enough positions to fit all labels that come before/after it.

### Matching Algorithm

```typescript
/**
 * Resolve label for a given anchor using value-based matching
 *
 * @param guid - Component GUID
 * @param anchorIndex - Index of the anchor in the memoizedState chain
 * @param anchorValue - Current value of the hook state
 * @param allFiberAnchors - All stateful hooks in the fiber (labeled + unlabeled)
 * @returns A resolved label, a union of possible labels with 'unknown' (in source order), or 'unknown' if no match
 */
function resolveHookLabel(
  guid: string,
  anchorIndex: number,
  anchorValue: unknown,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): string {
  // Get all labels for this component
  const labels = getLabelsForGuid(guid); // Array<{ index, value, label }>

  // Group fiber anchors by value
  const valueGroup = allFiberAnchors.filter((a) => a.value === anchorValue);

  // Unique value in fiber → direct match
  if (valueGroup.length === 1) {
    const match = labels.find((l) => l.value === anchorValue);
    return match?.label ?? "unknown";
  }

  // Duplicate values in fiber
  const labelsWithValue = labels.filter((l) => l.value === anchorValue);

  // All occurrences labeled → ordinal match
  if (labelsWithValue.length === valueGroup.length) {
    // Sort once before processing
    const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
    const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);

    // Find ordinal position of this anchor among all with same value
    const ordinal = sortedAnchors.findIndex((a) => a.index === anchorIndex);

    // Match to the Nth label with this value
    return sortedLabels[ordinal]?.label ?? "unknown";
  }

  // Partial coverage → use ordinal constraints to narrow possibilities
  // A label can only match an anchor if there are enough positions
  // between them to fit the other known labels
  const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);
  const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
  const currentAnchorOrdinal = sortedAnchors.findIndex(
    (a) => a.index === anchorIndex
  );

  const possibleLabels = sortedLabels.filter((label, labelOrdinal) => {
    // How many labeled hooks come before this one?
    const labelsBefore = labelOrdinal;

    // How many labeled hooks come after this one?
    const labelsAfter = sortedLabels.length - labelOrdinal - 1;

    // Check if there's room for all preceding/following labels
    return (
      currentAnchorOrdinal >= labelsBefore &&
      sortedAnchors.length - currentAnchorOrdinal - 1 >= labelsAfter
    );
  });

  // Return union of possible labels + unknown (in source order, not alphabetical)
  const labelNames = possibleLabels
    .sort((a, b) => a.index - b.index) // Preserve source order for developer clarity
    .map((l) => l.label);

  // If no labels match, return just "unknown" (not "unknown | unknown | ...")
  if (labelNames.length === 0) {
    return "unknown";
  }

  return [...labelNames, "unknown"].join(" | ");
}
```

### Understanding Ordinal Constraints

The ordinal constraints logic leverages the fact that we know the **relative order** of labeled hooks from build-time. Even when we can't make a perfect match, we can eliminate impossible combinations.

#### Algorithm methaphor

_British bobby, slightly exasperated_

"Look, I can't tell you EXACTLY who you are - could be filteredTodos, could be that unlabeled ruffian from node_modules, frankly I haven't got a clue. BUT - and this is important - I can tell you that you're RELATIVELY in order. Sort of. Mostly. At least SOMEWHAT organized, you see?"

_Adjusts helmet_

"Anchor 1, you're RELATIVELY likely to be filteredTodos... or unknown. Can't be completely sure, but relatively speaking, you're not completedTodos. That much I know. That's partial order for you - not perfect, but better than complete chaos, innit?"

_Shrugs_

"It's not COMPLETE disambiguation, but it's RELATIVELY disambiguated. We maintain what order we CAN, given the circumstances. Very British approach, really - make do with what you've got and call it 'relative order'. Keeps the uncertainty somewhat civilized."

The algorithm is a pragmatic British officer admitting he can't solve everything perfectly, but he'll maintain RELATIVE order as best he can!

#### Example Walkthrough

**Given**:

- Labels: `["filteredTodos" (index 0), "completedTodos" (index 2)]` with value `[]`
- Fiber anchors: `[anchor1, anchor2, anchor3]` all with value `[]`
- One unlabeled hook exists among the three

**For anchor 1** (ordinal position 0):

- Can it be "filteredTodos"? Check: 0 labels before, 1 label after
  - anchor1 has 0 positions before (0 >= 0 ✓)
  - anchor1 has 2 positions after (2 >= 1 ✓)
  - **Possible**: ✓
- Can it be "completedTodos"? Check: 1 label before, 0 labels after
  - anchor1 has 0 positions before (0 >= 1 ✗)
  - **Not possible**: There's no room for "filteredTodos" to come before it
- **Result**: `"filteredTodos | unknown"`

**For anchor 2** (ordinal position 1):

- Can it be "filteredTodos"? Check: 0 labels before, 1 label after
  - anchor2 has 1 position before (1 >= 0 ✓)
  - anchor2 has 1 position after (1 >= 1 ✓)
  - **Possible**: ✓
- Can it be "completedTodos"? Check: 1 label before, 0 labels after
  - anchor2 has 1 position before (1 >= 1 ✓)
  - anchor2 has 1 position after (1 >= 0 ✓)
  - **Possible**: ✓
- **Result**: `"filteredTodos | completedTodos | unknown"`

**For anchor 3** (ordinal position 2):

- Can it be "filteredTodos"? Check: 0 labels before, 1 label after
  - anchor3 has 2 positions before (2 >= 0 ✓)
  - anchor3 has 0 positions after (0 >= 1 ✗)
  - **Not possible**: There's no room for "completedTodos" to come after it
- Can it be "completedTodos"? Check: 1 label before, 0 labels after
  - anchor3 has 2 positions before (2 >= 1 ✓)
  - anchor3 has 0 positions after (0 >= 0 ✓)
  - **Possible**: ✓
- **Result**: `"completedTodos | unknown"`

#### Key Rules

1. **Ordinal preservation**: _Relative Order Must Be Maintained_ - If label A has a lower build-time index than label B, then A must appear at a lower fiber position than B
2. **Gap requirement**: For a label at position N among labeled hooks, there must be at least N positions before it in the fiber, and at least (totalLabels - N - 1) positions after it
3. **Unknown is always possible**: Any anchor could be the unlabeled hook, so "unknown" is always included in the union

## Implementation Plan

### Step 1: Update Storage Structure

**File**: `packages/auto-tracer-react18/src/lib/functions/hookLabels.ts`

**Current**:

```typescript
// Map<GUID, Record<index, label>>
type LabelsRegistry = Map<string, Record<number, string>>;
```

**New**:

```typescript
interface LabelEntry {
  index: number; // Build-time ordinal for ordering
  value: unknown; // Current state value for matching
  label: string; // Friendly name
}

// Map<GUID, Array<LabelEntry>>
type LabelsRegistry = Map<string, LabelEntry[]>;
```

### Step 2: Update Label Registration

**File**: `packages/auto-tracer-react18/src/lib/functions/renderRegistry.ts`

**Current**:

```typescript
labelState(label: string, index: number): void {
  if (typeof index !== 'number') {
    console.warn('labelState: index must be a number');
    return;
  }
  addLabelForGuid(this.guid, label, index);
}
```

**New**:

```typescript
labelState(label: string, index: number, ...values: unknown[]): void {
  if (typeof index !== 'number') {
    console.warn('labelState: index must be a number');
    return;
  }
  // Multiple values can be passed for multi-value hooks (e.g., useState)
  // For single-value hooks, only the first value is used
  const value = values[0];
  addLabelForGuid(this.guid, { label, index, value });
}
```

### Step 3: Update Injection Logic

**File**: `packages/auto-tracer-inject-react18/src/functions/transform/helpers/injectIntoBlockStatementDirect.ts`

**Current Injection**:

```typescript
// After: const filteredTodos = useAppSelector(selectFilteredTodos);
logger.labelState("filteredTodos", 0);
```

**New Injection**:

```typescript
// After: const filteredTodos = useAppSelector(selectFilteredTodos);
logger.labelState("filteredTodos", 0, filteredTodos);

// For useState (array destructuring)
// After: const [count, setCount] = useState(0);
logger.labelState("count", 1, count);
// Note: We only capture the state value, not the setter
```

**Key Changes**:

- Pass the variable reference as the third argument
- For `useState` hooks with array destructuring, extract the first element (state value)
- For `useAppSelector` and similar hooks, pass the return value directly

### Step 4: Update Resolution Logic

**File**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

**Current**:

```typescript
const label = resolveHookLabel(guid, targetIndex) ?? `state${targetIndex}`;
```

**New**:

```typescript
// CRITICAL: Collect ALL anchors (changed + unchanged) for correct matching
// Even hooks with unchanged values must be included to properly count duplicates
const allAnchors = anchors.map((anchor, idx) => ({
  index: idx,
  value: anchor.memoizedState, // The actual state value
}));

// Resolve each anchor (but only log meaningfulStateChanges)
const label =
  resolveHookLabel(guid, anchorIndex, anchor.memoizedState, allAnchors) ??
  `state${targetIndex}`;
```

**Important Note**: The `allAnchors` array must include ALL stateful hooks from the fiber, not just those with changed values. This is essential for Scenario 3 (ordinal constraints) to work correctly. If an unlabeled hook has an unchanged value, it still affects the count of duplicates and must be included in the matching algorithm.
`state${targetIndex}`;

````

### Step 5: Update Hook Labels Functions

**File**: `packages/auto-tracer-react18/src/lib/functions/hookLabels.ts`

**New Functions**:

```typescript
/**
 * Add a label with value for a component's hook
 */
export function addLabelForGuid(
  guid: string,
  entry: { label: string; index: number; value: unknown }
): void {
  if (!guidToLabelsMap.has(guid)) {
    guidToLabelsMap.set(guid, []);
  }
  guidToLabelsMap.get(guid)!.push(entry);
}

/**
 * Get all label entries for a component
 */
export function getLabelsForGuid(guid: string): LabelEntry[] {
  return guidToLabelsMap.get(guid) ?? [];
}

/**
 * Resolve hook label using value-based matching with ordinal disambiguation
 */
export function resolveHookLabel(
  guid: string,
  anchorIndex: number,
  anchorValue: unknown,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): string | undefined {
  const labels = getLabelsForGuid(guid);

  // Group fiber anchors by value
  const valueGroup = allFiberAnchors.filter((a) => a.value === anchorValue);

  // Scenario 1: Unique value in fiber
  if (valueGroup.length === 1) {
    const match = labels.find((l) => l.value === anchorValue);
    return match?.label;
  }

  // Scenarios 2 & 3: Duplicate values
  const labelsWithValue = labels.filter((l) => l.value === anchorValue);

  // Scenario 2: All occurrences labeled → ordinal match
  if (labelsWithValue.length === valueGroup.length) {
    const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
    const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);

    const ordinal = sortedAnchors.findIndex((a) => a.index === anchorIndex);
    return sortedLabels[ordinal]?.label;
  }

  // Scenario 3: Partial coverage → use ordinal constraints
  const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);
  const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
  const currentAnchorOrdinal = sortedAnchors.findIndex(
    (a) => a.index === anchorIndex
  );

  const possibleLabels = sortedLabels.filter((label, labelOrdinal) => {
    const labelsBefore = labelOrdinal;
    const labelsAfter = sortedLabels.length - labelOrdinal - 1;

    return (
      currentAnchorOrdinal >= labelsBefore &&
      sortedAnchors.length - currentAnchorOrdinal - 1 >= labelsAfter
    );
  });

  // Return union of possible labels + unknown (in source order, not alphabetical)
  const labelNames = possibleLabels
    .sort((a, b) => a.index - b.index)  // Preserve source order for developer clarity
    .map((l) => l.label);

  // If no labels match, return just "unknown" (not "unknown | unknown | ...")
  if (labelNames.length === 0) {
    return "unknown";
  }

  return [...labelNames, "unknown"].join(" | ");
}
````

## Test-Driven Development Plan

### Test 1: Unique Value Match

```typescript
describe("resolveHookLabel - Scenario 1: Unique Values", () => {
  it("should match label by unique value", () => {
    const guid = "test-component-1";

    // Register labels
    addLabelForGuid(guid, { label: "filteredTodos", index: 0, value: [] });
    addLabelForGuid(guid, { label: "loading", index: 1, value: false });

    // Fiber state (all unique values)
    const allAnchors = [
      { index: 0, value: [] },
      { index: 1, value: false },
      { index: 2, value: 42 }, // unlabeled
    ];

    // Test resolution
    expect(resolveHookLabel(guid, 0, [], allAnchors)).toBe("filteredTodos");
    expect(resolveHookLabel(guid, 1, false, allAnchors)).toBe("loading");
    expect(resolveHookLabel(guid, 2, 42, allAnchors)).toBeUndefined();
  });
});
```

### Test 2: Ordinal Match (All Labeled)

```typescript
describe("resolveHookLabel - Scenario 2: Duplicate Values, All Labeled", () => {
  it("should match by ordinal position when all occurrences are labeled", () => {
    const guid = "test-component-2";

    // Register labels (all with value [])
    addLabelForGuid(guid, { label: "filteredTodos", index: 0, value: [] });
    addLabelForGuid(guid, { label: "completedTodos", index: 1, value: [] });
    addLabelForGuid(guid, { label: "archivedTodos", index: 2, value: [] });

    // Fiber state (all same value)
    const emptyArray = [];
    const allAnchors = [
      { index: 0, value: emptyArray },
      { index: 1, value: emptyArray },
      { index: 2, value: emptyArray },
    ];

    // Test ordinal matching
    expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe(
      "filteredTodos"
    );
    expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe(
      "completedTodos"
    );
    expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe(
      "archivedTodos"
    );
  });
});
```

### Test 3: Ordinal Constraints (Partial Labels)

```typescript
describe("resolveHookLabel - Scenario 3: Duplicate Values, Partial Labels", () => {
  it("should return union of possible labels based on ordinal constraints", () => {
    const guid = "test-component-3";

    // Register labels (only 2 out of 3 labeled)
    addLabelForGuid(guid, { label: "filteredTodos", index: 0, value: [] });
    addLabelForGuid(guid, { label: "completedTodos", index: 2, value: [] });

    // Fiber state (3 hooks with same value, but only 2 labeled)
    const emptyArray = [];
    const allAnchors = [
      { index: 0, value: emptyArray }, // could be filteredTodos or unknown
      { index: 1, value: emptyArray }, // could be any of the three
      { index: 2, value: emptyArray }, // could be completedTodos or unknown
    ];

    // Test: ordinal constraints narrow possibilities
    expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe(
      "filteredTodos | unknown"
    );
    expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe(
      "filteredTodos | completedTodos | unknown"
    );
    expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe(
      "completedTodos | unknown"
    );
  });
});
```

### Test 4: Mixed Scenarios

```typescript
describe("resolveHookLabel - Mixed Scenarios", () => {
  it("should handle mix of unique and duplicate values", () => {
    const guid = "test-component-4";

    // Register labels
    addLabelForGuid(guid, { label: "todos1", index: 0, value: [] });
    addLabelForGuid(guid, { label: "todos2", index: 1, value: [] });
    addLabelForGuid(guid, { label: "loading", index: 2, value: false });

    // Fiber state
    const emptyArray = [];
    const allAnchors = [
      { index: 0, value: emptyArray }, // duplicate, all labeled
      { index: 1, value: emptyArray }, // duplicate, all labeled
      { index: 2, value: false }, // unique
      { index: 3, value: 42 }, // unique, unlabeled
    ];

    // Ordinal match for duplicates
    expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe("todos1");
    expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe("todos2");

    // Direct match for unique
    expect(resolveHookLabel(guid, 2, false, allAnchors)).toBe("loading");

    // Unlabeled unique
    expect(resolveHookLabel(guid, 3, 42, allAnchors)).toBeUndefined();
  });
});
```

### Test 5: Unnecessary Rerender Detection

```typescript
describe("resolveHookLabel - Unnecessary Rerender Detection", () => {
  it("should detect when reference changed but content is identical", () => {
    const guid = "test-component-5";

    // Two different array references with same content
    const prevArray = [{ id: 1, text: "Buy milk" }];
    const currentArray = [{ id: 1, text: "Buy milk" }]; // Different ref, same JSON

    // Verify JSON comparison
    const prevJson = stringify(prevArray);
    const currentJson = stringify(currentArray);

    expect(prevArray).not.toBe(currentArray); // Different references
    expect(prevJson).toBe(currentJson); // Identical JSON

    // This is an unnecessary rerender - should be flagged in logging
    // (Detection happens in logging layer, not in resolveHookLabel)
  });
});
```

### Test 6: Multiple Unlabeled Hooks with Same Value

```typescript
describe("resolveHookLabel - Multiple Unlabeled Hooks", () => {
  it("should return plain 'unknown' for each unlabeled hook (not a union)", () => {
    const guid = "test-component-6";

    // No labels registered for this component
    // Three unlabeled hooks all share the same value

    const emptyArray = [];
    const allAnchors = [
      { index: 0, value: emptyArray },
      { index: 1, value: emptyArray },
      { index: 2, value: emptyArray },
    ];

    // Each should resolve to plain "unknown", not "unknown | unknown | unknown"
    // Algorithm flow:
    // 1. valueGroup.length = 3 (not unique, skip Scenario 1)
    // 2. labelsWithValue.length = 0 (no labels for this value)
    // 3. 0 !== 3, so skip Scenario 2 (not all labeled)
    // 4. Enter Scenario 3, possibleLabels = [] (no labels to constrain)
    // 5. labelNames.length === 0, return "unknown"
    expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe("unknown");
    expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe("unknown");
    expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe("unknown");
  });
});
```

## Edge Cases and Considerations

### 1. Value Comparison

**Challenge**: JavaScript reference equality vs. value equality

```typescript
const arr1 = [];
const arr2 = [];
arr1 === arr2; // false (different references)
```

**Solution**: Use reference equality (`===`) for matching. Labels are registered during the same render cycle, so values will have the same reference.

### 2. Primitive vs. Object Values

**Primitives** (numbers, strings, booleans):

- Value equality works naturally
- Example: `false === false` is always true

**Objects** (arrays, objects):

- Reference equality is used
- Same reference during a single render cycle
- Different renders may have new references (expected behavior)

### 3. Labels Cleared Every Render

The label registry is cleared via `clearRenderRegistry()` after every render cycle in `detectUpdatedComponents.ts`. This is **beneficial** for value-based matching:

- Fresh values every render
- No stale references
- Simpler implementation (no need to track value changes)

### 4. Circular References

All values are serialized using `flatted.stringify()` (from the `flatted` package), which safely handles circular references. This ensures objects with cyclic dependencies (e.g., DOM nodes, complex state graphs, or objects with circular references) are logged without errors or infinite loops.

**Example:**

```typescript
const obj = { name: "Todo" };
obj.self = obj; // Circular reference
// flatted.stringify() handles this gracefully
```

This is already implemented in `packages/auto-tracer-react18/src/lib/functions/stringify.ts`.

### 5. Performance Considerations

**Grouping and Sorting**:

- Each anchor resolution requires filtering and sorting
- For typical components (5-10 hooks), performance impact is negligible
- For large components (50+ hooks), consider caching value groups

**Optimization** (future):

```typescript
// Cache value groups per render cycle
const valueGroupsCache = new Map<unknown, Array<{ index: number; value: unknown }>>();

function getValueGroup(value: unknown, allAnchors: Array<...>) {
  if (!valueGroupsCache.has(value)) {
    valueGroupsCache.set(value, allAnchors.filter(a => a.value === value));
  }
  return valueGroupsCache.get(value)!;
}
```

### 6. Unnecessary Rerender Detection

The fiber provides both current (`anchor.memoizedState`) and previous (`alternate.memoizedState`) values for each hook. This enables detecting a common React performance anti-pattern: **creating new object references with identical content**.

**Detection strategy:**

```typescript
const prevJson = stringify(prevValue);
const currentJson = stringify(currentValue);
const isUnnecessaryRerender =
  prevValue !== currentValue && prevJson === currentJson;
```

**Example of the anti-pattern:**

```typescript
// ❌ BAD - creates new object reference every render
function useTodo() {
  const [todo] = useState({ id: 1, text: "Buy milk" });
  return { todo }; // New object wrapper on every render!
}

function App() {
  const result = useTodo();
  useEffect(() => {
    console.log("Changed!");
  }, [result]); // Triggers every render because result is a new object!
  return <TodoList data={result} />;
}

// ✅ GOOD - return the todo directly, not wrapped
function useTodo() {
  const [todo] = useState({ id: 1, text: "Buy milk" });
  return todo; // Same reference every render
}

// ✅ ALSO GOOD - memoize the wrapper object
function useTodo() {
  const [todo] = useState({ id: 1, text: "Buy milk" });
  return useMemo(() => ({ todo }), [todo]); // Stable reference
}
```

**Logging format:**

```
⚠️ filteredTodos (unnecessary rerender): [{id: 1, text: 'Buy milk'}] → [{id: 1, text: 'Buy milk'}]
```

This helps developers identify expensive rerenders caused by referentially unstable data.

### 7. Multiple Unlabeled Hooks with Same Value

When multiple unlabeled hooks share the same value, they should each resolve to just "unknown" (not "unknown | unknown | unknown"). Each changed hook should still be logged separately because **all changes are important**.

**Example scenario:**

```typescript
// Component has 3 unlabeled hooks from a library, all with value []
// All three change from [{...}] to []
```

**Label resolution:**

- Each unlabeled hook with value `[]` resolves to `"unknown"` (not a union)
- This happens in Scenario 3 when `labelsWithValue.length === 0`
- Return just `"unknown"`, not `"unknown | unknown | unknown"`

**Correct logging** (all changes shown, clean labels):

```
unknown changed: [{id: 1}] → []
unknown changed: [{id: 2}] → []
unknown changed: [{id: 2}] → []
```

**Implementation note**: When no labels match a value group, each anchor in that group should resolve to plain `"unknown"`, not a union. All changes must be logged individually as each represents a meaningful state update.

### 8. Logging Format

The logging format differentiates between three types of state changes:

**Case 1: Real change** (reference changed, content changed):

```
filteredTodos changed: [{id: 1, text: 'Buy milk', completed: false}] → []
```

**Case 2: Unnecessary rerender** (reference changed, content identical):

```
⚠️ filteredTodos (unnecessary rerender): [{id: 1, text: 'Buy milk'}] → [{id: 1, text: 'Buy milk'}]
```

**Case 3: No change** (reference unchanged):

```
// Not logged (no change, no rerender trigger)
```

**For Scenario 3 (partial labels with ordinal constraints):**

```
filteredTodos | unknown changed: [{id: 1, text: 'Buy milk', completed: false}] → []
filteredTodos | completedTodos | unknown changed: [{id: 2, text: 'Walk dog', completed: true}, {id: 3, text: 'Read book', completed: true}] → []
completedTodos | unknown changed: [] → []
```

**Note**: Union labels are displayed in **source order** (the order they appear in the code), not alphabetical, to help developers correlate logs with their component structure.

**For multiple unlabeled hooks with the same value:**

When several unlabeled hooks share the same value, each resolves to plain `"unknown"` (not a union like "unknown | unknown"). All changes are logged individually:

```
unknown changed: [{id: 1}] → []
unknown changed: [{id: 2}] → []
unknown changed: [{id: 2}] → []
```

Each change is important and must be shown. The label is clean (just "unknown"), not redundant ("unknown | unknown | unknown").

This format shows:

- The union of possible labels based on ordinal constraints
- That it couldn't be fully disambiguated (includes `unknown`)
- Clear indication which labels are possible for each anchor
- **The actual value change (from → to)** which is essential for debugging
- **Clean "unknown" labels** (not duplicated in unions)
- **All changes logged** (every state change is important)

_**Important:** This tool is a debugging aid for the end user. The end user of this tool is a React developer._

## Migration Path

### Phase 1: Implement Core Logic (TDD)

1. Write failing tests for all three scenarios
2. Update `hookLabels.ts` storage structure
3. Update `renderRegistry.ts` labelState signature
4. Verify tests pass

### Phase 2: Update Injection

1. Update `injectIntoBlockStatementDirect.ts` to inject values
2. Test with example apps
3. Verify build-time transformation is correct

### Phase 3: Update Resolution

1. Update `walkFiberForUpdates.ts` to collect all anchor values
2. Update resolution calls to use new signature
3. Test with E2E tests

### Phase 4: Refinement

1. Test edge cases (many duplicates, mixed scenarios)
2. Performance profiling
3. Documentation updates

## Expected Outcomes

### Success Metrics

**Before** (current broken state):

```
state9 changed: [{id: 1, text: 'Buy milk', completed: false}] -> []
state10 changed: true -> false
state11 changed: null -> {message: 'Network error', code: 500}
state12 changed: 'all' -> 'active'
```

**After** (unique values):

```
filteredTodos changed: [{id: 1, text: 'Buy milk', completed: false}] -> []
loading changed: true -> false
error changed: null -> {message: 'Network error', code: 500}
filter changed: 'all' -> 'active'
```

**After** (duplicate values, all labeled):

```
filteredTodos changed: [{id: 1, text: 'Buy milk', completed: false}] -> []        // First []
completedTodos changed: [{id: 2, text: 'Walk dog', completed: true}, {id: 3, text: 'Read book', completed: true}] -> []  // Second []
archivedTodos changed: [] -> []                 // Third []
```

**After** (duplicate values, partial labels with ordinal constraints):

```
filteredTodos | unknown changed: [{id: 1, text: 'Buy milk', completed: false}] -> []
filteredTodos | completedTodos | unknown changed: [{id: 2, text: 'Walk dog', completed: true}, {id: 3, text: 'Read book', completed: true}] -> []
completedTodos | unknown changed: [] -> []
```

### Correctness Guarantees

1. **Unique values always match** (Scenario 1)
2. **All labeled duplicates match by ordinal** (Scenario 2)
3. **Partial labeled duplicates fall back to unknown** (Scenario 3)
4. **Unlabeled hooks always show "stateN"** (expected behavior)

## Conclusion

This solution completely eliminates the index space mismatch problem by using values as the primary matching key. The ordinal disambiguation ensures that even when multiple hooks share the same value, they can be correctly identified if all occurrences are labeled. The fallback to "unknown" for partial coverage provides clear feedback about ambiguous cases while maintaining correctness.

The implementation follows TDD principles, starting with comprehensive tests that define the expected behavior for all scenarios before making any code changes.

## Acceptance test reports

[x] #1 The auto-tracer-state-marker shows in the logs

Actual: Initial state: Symbol(auto-tracer-state-marker) color: #df7f02; font-style: italic
Expected: No state log output of auto-tracer-state-marker visible.
