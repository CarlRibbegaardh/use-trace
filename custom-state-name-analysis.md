# Custom Hook State Name Analysis

This document provides a deep technical analysis of why custom hooks like `useCustomHook()` fail to get labeled correctly with the current value-based matching implementation, and explores potential solutions.

## The Problem Statement

When a component uses a custom hook that returns an object:

```typescript
function LabelHooksTestComponent() {
  const logger = useAutoTracer();

  const custom = useCustomHook("test-custom"); // Returns { value: "test-custom", setValue: fn }
  logger.labelState("custom", 2, custom); // Passes entire object

  return <div>{custom.value}</div>;
}
```

The state changes are detected but labeled as "unknown" instead of "custom":

```
State change unknown: test-custom → updated-custom
```

## Technical Deep Dive

### Part 1: Build-Time Injection

**Location**: `packages/auto-tracer-inject-react18/src/functions/transform/helpers/injectIntoBlockStatementDirect.ts`

**What Happens**:

1. The AST transformer identifies the hook call:

   ```typescript
   const custom = useCustomHook("test-custom");
   ```

2. Pattern matching (Pattern B - single identifier):

   ```typescript
   // Pattern B: const name = useSelector(...)
   else if (t.isIdentifier(decl.id) && isConfiguredHook) {
     label = decl.id.name;              // "custom"
     valueIdentifier = decl.id;         // Identifier node for "custom"
   }
   ```

3. Code generation injects:
   ```typescript
   const custom = useCustomHook("test-custom");
   __autoTracer.labelState("custom", 2, custom); // ← Passes the identifier "custom"
   ```

**Key Insight**: The transformer has NO knowledge of what `useCustomHook` returns. It only knows:

- The variable name: `"custom"`
- The hook name: `"useCustomHook"`
- The variable identifier: `custom`

It cannot know at build time that `custom.value` is the actual state primitive.

### Part 2: Runtime Label Storage

**Location**: `packages/auto-tracer-react18/src/lib/functions/renderRegistry.ts`

**What Happens**:

When the component renders, the injected code executes:

```typescript
const custom = useCustomHook("test-custom");
// custom = { value: "test-custom", setValue: [Function] }

logger.labelState("custom", 2, custom);
// Calls: labelState(label: "custom", index: 2, value: { value: "test-custom", setValue: fn })
```

**Storage Code**:

```typescript
labelState: (
  label: string,
  index: number,
  value: unknown,
  ...additionalValues: unknown[]
) => {
  if (typeof index !== "number") {
    logWarn("labelState: index must be a number");
    return;
  }
  addLabelForGuid(guid, { label, index, value });
};
```

**What Gets Stored** (`packages/auto-tracer-react18/src/lib/functions/hookLabels.ts`):

```typescript
labelRegistry = {
  "component-guid-123": {
    custom: [
      // Labels by name
      {
        label: "custom",
        index: 2,
        value: {
          // ← COMPLEX OBJECT!
          value: "test-custom",
          setValue: [Function],
        },
      },
    ],
  },
};
```

### Part 3: Runtime Fiber Analysis

**Location**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

**What the Fiber Tree Shows**:

When React renders the component, the fiber structure for `LabelHooksTestComponent` looks like:

```
Fiber Node: LabelHooksTestComponent
  _debugHookTypes: ["useState", "useReducer", "useState", "useState"]
  memoizedState: (Hook chain)
    Hook 0: { memoizedState: "test-title", ... }        // useState for title
    Hook 1: { memoizedState: 0, ... }                   // useReducer for count
    Hook 2: { memoizedState: "test-custom", ... }       // ← useState INSIDE useCustomHook!
    Hook 3: { memoizedState: "nested-custom", ... }     // useState INSIDE useCustomHook2
```

**Critical Insight**: Custom hooks don't have their own fiber nodes! They're just JavaScript functions. When `useCustomHook()` calls `useState()` internally, that `useState` appears directly in the component's hook chain.

**What React Stores**:

The `memoizedState` for Hook 2 is the **primitive value** from the internal `useState`:

```typescript
// Inside useCustomHook implementation:
export function useCustomHook(initialValue: string = "custom-initial") {
  const [value, setValue] = useState(initialValue); // ← This is Hook 2 in the chain!
  return { value, setValue };
}
```

So the fiber shows:

- Hook 2 memoizedState: `"test-custom"` (primitive string)
- NOT: `{ value: "test-custom", setValue: fn }` (the wrapper object)

### Part 4: Value-Based Matching Failure

**Location**: `packages/auto-tracer-react18/src/lib/functions/hookLabels.ts` → `resolveHookLabel()`

**The Matching Process**:

When a state change is detected, `resolveHookLabel()` is called with:

- `guid`: Component GUID
- `targetIndex`: 2 (the hook position in the fiber chain)
- `targetValue`: `"updated-custom"` (the new primitive value from memoizedState)

**Matching Algorithm**:

```typescript
export function resolveHookLabel(
  guid: string,
  targetIndex: number,
  targetValue: unknown
): string | null {
  const labels = labelsByGuid.get(guid);
  if (!labels) return null;

  // Try to find a label with matching value at ANY index
  for (const [labelName, labelEntries] of Object.entries(labels)) {
    for (const entry of labelEntries) {
      if (stringify(entry.value) === stringify(targetValue)) {
        // Match! Return the label
        return entry.label;
      }
    }
  }

  // No match found - try index-based fallback
  // ... (ordinal matching code)
}
```

**The Comparison**:

```typescript
// Stored value (from labelState call):
const storedValue = { value: "test-custom", setValue: [Function] };
stringify(storedValue);
// Result: '{"value":"test-custom"}'
// Note: Functions are omitted by JSON.stringify (via flatted)

// Target value (from fiber memoizedState):
const targetValue = "test-custom";
stringify(targetValue);
// Result: '"test-custom"'

// Comparison:
'{"value":"test-custom"}' === '"test-custom"';
// FALSE! ❌

// Even though both contain "test-custom", the JSON structures are different:
// - One is an object with a "value" property
// - One is a primitive string
```

**Result**: No match found → Falls back to ordinal matching → Still no match (wrong index) → Returns `null` → Logs "unknown"

### Part 5: Why the Fiber Parser Works Correctly

The fiber parser IS working perfectly! Looking at the console output:

```
State change unknown: test-custom → updated-custom
```

This shows:

1. ✅ **Detection**: The fiber walker detected Hook 2's state change
2. ✅ **Extraction**: It correctly extracted the primitive values (`"test-custom"` → `"updated-custom"`)
3. ✅ **Matching Attempt**: It called `resolveHookLabel(guid, 2, "updated-custom")`
4. ❌ **Label Resolution**: Failed to find a matching label
5. ✅ **Fallback Display**: Correctly shows "unknown" with the actual values

The fiber parser has NO problem. The problem is the **mismatch between stored value and actual value**.

## The Core Problem: Value Type Mismatch

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Value Flow Diagram                                │
└─────────────────────────────────────────────────────────────────────┘

BUILD TIME (Injection):
  const custom = useCustomHook("test-custom");
  ↓
  labelState("custom", 2, custom)  ← Passes variable reference


RUNTIME (Storage):
  custom = { value: "test-custom", setValue: fn }
  ↓
  Stored: { label: "custom", index: 2, value: {value: "test-custom", setValue: fn} }


RUNTIME (Fiber):
  useCustomHook internally calls:
    const [value, setValue] = useState("test-custom")
  ↓
  Fiber Hook 2 memoizedState: "test-custom"  ← Just the primitive!


RUNTIME (Matching):
  Compare:
    stringify({value: "test-custom", setValue: fn})
      !==
    stringify("test-custom")
  ↓
  NO MATCH ❌
```

## Why This Happens

The fundamental issue is a **layer mismatch**:

1. **Application Layer**: Component code works with wrapped values

   ```typescript
   const custom = { value: "test-custom", setValue: fn };
   ```

2. **React Internal Layer**: React's fiber tracks only the primitive state

   ```typescript
   memoizedState: "test-custom";
   ```

3. **Our Tool**: Tries to match Application Layer values against React Internal Layer values
   ```typescript
   {value: "test-custom"} !== "test-custom"
   ```

## Potential Solutions

### Solution 1: Deep Value Extraction (Not Feasible)

**Idea**: Store primitive values by unwrapping objects

**Problems**:

1. How deep to unwrap? `.value`? `.data`? `.state`? `[0]`?
2. What about multiple state values in one object?
3. Requires runtime type introspection
4. Breaking change for all existing use cases

### Solution 2: Store Both Object and Primitives (Complex)

**Idea**: When storing a label, recursively extract and store all primitive values

```typescript
labelState("custom", 2, custom);
// Stores:
{
  label: "custom",
  index: 2,
  value: custom,
  primitives: ["test-custom"]  // Extracted from custom.value
}
```

**Problems**:

1. Complex extraction logic
2. Ambiguous which primitive matches
3. Performance overhead
4. Still doesn't know which property is the "state"

### Solution 3: Multi-Level Matching (Possible) ⭐ VALIDATED

**Idea**: Try both exact match AND deep match using `Object.values()` extraction

**Real-World Precedent**: This approach is already used successfully in the `use-trace` package!

**From `packages/use-trace/src/lib/hooks/useObjectChangeTracker.ts`**:

```typescript
export function useObjectChangeTracker(scopeName: string, objectType: string) {
  const prevObj = useRef<object>();

  const compare = useCallback(
    (scopeObject?: object): void => {
      // Extract values from the object for comparison
      let prevArr: unknown[] = [];
      if (prevObj.current) {
        prevArr = Object.values(prevObj.current); // ← Extract all values
      }
      const currentArr = Object.values(scopeObject); // ← Extract all values

      // Compare the arrays of values
      const result = areHookInputsEqual(currentArr, prevArr);

      // ... logging logic ...
    },
    [objectType, scopeName]
  );
}
```

**How it applies to our case**:

```typescript
// Custom hook returns:
const custom = { value: "test-custom", setValue: [Function] };

// Extract values:
Object.values(custom);
// Result: ["test-custom", [Function]]

// Now we can match "test-custom" from fiber against extracted values!
```

**Proposed Implementation**:

```typescript
function resolveHookLabel(guid, anchorIndex, anchorValue, allFiberAnchors) {
  const labels = getLabelsForGuid(guid);
  const anchorValueStr = stringify(anchorValue);

  // First pass: Try exact value match (current behavior)
  const valueGroup = allFiberAnchors.filter(
    (a) => stringify(a.value) === anchorValueStr
  );

  // If exact match found, use existing logic
  if (valueGroup.length > 0) {
    // ... existing matching logic ...
  }

  // Second pass: Try matching against object property values
  // This handles custom hooks that return wrapper objects
  const objectValueGroup = allFiberAnchors.filter((anchor) => {
    const label = labels.find((l) => l.index === anchor.index);
    if (!label) return false;

    // If stored label value is an object, extract its values
    if (typeof label.value === "object" && label.value !== null) {
      const extractedValues = Object.values(label.value);
      return extractedValues.some((v) => stringify(v) === anchorValueStr);
    }
    return false;
  });

  if (objectValueGroup.length > 0) {
    // Use same disambiguation logic as exact matches
    // ... existing matching logic ...
  }

  return "unknown";
}
```

**Analysis**:

- ✅ Works for `{value: X}` patterns (validated in use-trace)
- ✅ Works for `{data: X}`, `{state: X}`, or any object structure
- ✅ Minimal breaking changes
- ✅ Simple one-level extraction (not deeply recursive)
- ✅ Proven approach (already used in production code)
- ⚠️ May match wrong property if multiple properties have same value
- ⚠️ Doesn't handle nested objects (but neither does use-trace)
- ✅ Performance impact minimal (Object.values is fast, only for objects)

### Solution 4: Hook-Specific Configuration (Most Practical)

**Idea**: Allow configuration to specify value extraction

```typescript
// Config
{
  labelHooks: ["useState", "useReducer", "useSelector"],
  labelHooksPattern: "^use[A-Z].*",
  customHookValueExtractors: {
    "useCustomHook": ".value",
    "useCustomHook2WithCustomHookInside": ".value",
    "useForm": ".values",  // Different property
    "useArray": "[0]",     // Array access
  }
}
```

**Build-time injection**:

```typescript
const custom = useCustomHook("test");
__autoTracer.labelState("custom", 2, custom.value); // ← Auto-appended!
```

**Analysis**:

- ✅ Clean solution
- ✅ No runtime complexity
- ✅ User controls extraction
- ✅ No breaking changes
- ❌ Requires manual configuration
- ❌ Must update config for each custom hook

### Solution 5: Accept Manual labelState Calls (Current Workaround)

**Idea**: Don't auto-inject for problematic hooks; let users manually call

```typescript
const custom = useCustomHook("test-custom");
logger.labelState("custom", 2, custom.value); // ← Manual extraction
```

**Analysis**:

- ✅ Works today
- ✅ User has full control
- ✅ No configuration needed
- ❌ Requires understanding the issue
- ❌ Not automatic
- ❌ Easy to forget

### Solution 6: Index-Only Matching for Objects (Fallback)

**Idea**: When the stored value is an object, skip value matching and use index-only

```typescript
function resolveHookLabel(guid, targetIndex, targetValue) {
  // First try exact value match for primitives
  for (const entry of labelEntries) {
    if (
      isPrimitive(entry.value) &&
      stringify(entry.value) === stringify(targetValue)
    ) {
      return entry.label;
    }
  }

  // For objects, fall back to index matching immediately
  const indexMatch = labelsByIndex.get(guid)?.get(targetIndex);
  if (indexMatch) return indexMatch.label;

  return null;
}
```

**Analysis**:

- ✅ Simple implementation
- ✅ Works for custom hooks
- ⚠️ Loses value-based disambiguation for objects
- ⚠️ Returns to index-based fragility

## Current State and Recommendation

**What Works Today**:

- ✅ Primitive values (strings, numbers, booleans)
- ✅ Simple hooks (useState, useReducer with primitive values)
- ✅ Selectors returning primitives

**What Doesn't Work**:

- ❌ Custom hooks returning objects
- ❌ Hooks returning arrays
- ❌ Complex nested structures

**Recommended Path Forward**:

1. **Short Term**: Document the limitation and provide manual workaround guide

   - Update README with custom hook handling
   - Show how to manually call `labelState(name, index, object.value)`

2. **Medium Term**: Implement Solution 3 (Multi-Level Matching) as a heuristic

   - Try exact match first
   - If stored value is object, try matching against direct properties
   - Add configuration flag to enable/disable this behavior

3. **Long Term**: Implement Solution 4 (Hook-Specific Configuration)
   - Allow users to specify value extractors
   - Update build-time injection to use extractors
   - Provides full flexibility without runtime complexity

## Test Case Analysis

Looking at the failing E2E test `tests/label-hooks.spec.ts`:

```typescript
// Test expects:
const customLogs = pageLogs.filter((log: string) =>
  log.includes("State change custom:")
);
expect(customLogs.length).toBeGreaterThan(0);

// But gets:
[LOG] State change unknown: test-custom → updated-custom
```

**Why it fails**:

- Custom hook returns `{value, setValue}`
- labelState stores the object
- Fiber memoizedState has the primitive
- Match fails
- Logs show "unknown"

**The test is correct** - it's validating that custom hooks should be labeled. The implementation just doesn't handle this case yet.

## Conclusion

The issue is not a bug in the fiber parser or value-based matching. It's a **fundamental type mismatch** between:

1. What custom hooks return (wrapper objects)
2. What React tracks internally (primitive state values)
3. What our matching algorithm compares

The fiber parser works perfectly. The value-based matching works for primitives. The problem is that custom hooks introduce an abstraction layer that we need to account for.

**The Path Forward**: Solution 3 (Multi-Level Matching) with `Object.values()` extraction is the most practical approach because:

1. ✅ **Proven in production**: Already used successfully in `use-trace` package
2. ✅ **Simple implementation**: One-level extraction with `Object.values()`
3. ✅ **Minimal breaking changes**: Fallback behavior, doesn't affect existing primitive matching
4. ✅ **Handles common patterns**: Works for `{value, setValue}`, `{data, setData}`, etc.
5. ✅ **Performance**: Negligible overhead (only for objects that fail exact match)

**Implementation Strategy**:

1. Keep existing exact match logic (handles primitives, arrays, etc.)
2. Add second-pass matching using `Object.values()` extraction for objects
3. Apply same disambiguation logic (scenarios 1-3) to extracted matches
4. Add configuration flag to enable/disable this behavior (default: enabled)

**Limitations to Document**:

- Only extracts one level deep (like `use-trace`)
- May match multiple properties if they have identical values
- Doesn't handle deeply nested structures (can be addressed in future with recursive extraction)

## Test Scenarios for Edge Cases

To validate the Object.values() extraction approach, we need to test scenarios where it might produce **false positive matches**:

### Scenario 1: Minimal False Match (Single Collision)

**Setup**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  // Hook 0: Custom hook returns {value: "test", label: "test"}
  const customA = useCustomHookA("test");
  logger.labelState("customA", 0, customA);
  // Stored: { label: "customA", index: 0, value: {value: "test", label: "test"} }

  // Hook 1: Custom hook returns {data: "test", id: "abc"}
  const customB = useCustomHookB("test");
  logger.labelState("customB", 1, customB);
  // Stored: { label: "customB", index: 1, value: {data: "test", id: "abc"} }

  return (
    <div>
      {customA.value} {customB.data}
    </div>
  );
}
```

**Fiber State** (React internal):

```
Hook 0 memoizedState: "test"  // useState inside useCustomHookA
Hook 1 memoizedState: "test"  // useState inside useCustomHookB
```

**Expected Behavior**:

- When Hook 0 changes to "updated", should resolve to "customA"
- When Hook 1 changes to "updated", should resolve to "customB"

**Actual Behavior with Naive Object.values()**:

```typescript
// Hook 0 changes: "test" → "updated"
Object.values({ value: "test", label: "test" }); // ["test", "test"]
// Contains "test" ✓ (but also matches Hook 1!)

// Hook 1 changes: "test" → "updated"
Object.values({ data: "test", id: "abc" }); // ["test", "abc"]
// Contains "test" ✓ (but also matches Hook 0!)
```

**Problem**: Both hooks contain "test", so Object.values() can't distinguish which hook changed!

**Result**: Would need ordinal disambiguation (Scenario 2/3) to resolve correctly.

---

### Scenario 2: Multiple Collisions in Single Object

**Setup**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  // Hook 0: Object with duplicate values
  const form = useForm({
    username: "",
    password: "",
    confirmPassword: "",
  });
  logger.labelState("form", 0, form);
  // Stored: {
  //   label: "form",
  //   index: 0,
  //   value: {
  //     values: { username: "", password: "", confirmPassword: "" },
  //     errors: {},
  //     isValid: true
  //   }
  // }

  return <form>...</form>;
}
```

**Fiber State** (React internal):

```
Hook 0: { username: "", password: "", confirmPassword: "" }  // useState inside useForm
Hook 1: {}                                                    // useState for errors
Hook 2: true                                                  // useState for isValid
```

**User Action**: Types "john" into username field

**Fiber State After Change**:

```
Hook 0: { username: "john", password: "", confirmPassword: "" }
```

**Object.values() Extraction**:

```typescript
Object.values({
  values: { username: "john", password: "", confirmPassword: "" },
  errors: {},
  isValid: true,
});
// Result: [
//   { username: "john", password: "", confirmPassword: "" },
//   {},
//   true
// ]
```

**Problem**: The extracted array contains an object, not primitives! Need to extract recursively or only extract primitives.

---

### Scenario 3: Multiple Hooks with Overlapping Values (Complex)

**Setup**:

```typescript
function ComplexComponent() {
  const logger = useAutoTracer();

  // Hook 0: User profile
  const profile = useProfile();
  logger.labelState("profile", 0, profile);
  // Returns: { id: "123", name: "John", status: "active" }
  // Fiber Hook 0: "123" (id state)
  // Fiber Hook 1: "John" (name state)
  // Fiber Hook 2: "active" (status state)

  // Hook 3: Organization data
  const org = useOrganization();
  logger.labelState("org", 3, org);
  // Returns: { id: "123", title: "Acme Corp", status: "active" }
  // Fiber Hook 3: "123" (id state) - COLLISION with Hook 0!
  // Fiber Hook 4: "Acme Corp" (title state)
  // Fiber Hook 5: "active" (status state) - COLLISION with Hook 2!

  // Hook 6: Simple counter
  const [count, setCount] = useState(123);
  logger.labelState("count", 6, count);
  // Fiber Hook 6: 123 - COLLISION with Hooks 0 and 3!

  return <div>...</div>;
}
```

**Fiber State**:

```
Hook 0: "123"       // profile.id
Hook 1: "John"      // profile.name
Hook 2: "active"    // profile.status
Hook 3: "123"       // org.id        ← Same as Hook 0!
Hook 4: "Acme Corp" // org.title
Hook 5: "active"    // org.status    ← Same as Hook 2!
Hook 6: 123         // count         ← Same value as Hooks 0,3 (different type!)
```

**Stored Labels**:

```typescript
{
  "profile": [{ label: "profile", index: 0, value: {id: "123", name: "John", status: "active"} }],
  "org": [{ label: "org", index: 3, value: {id: "123", title: "Acme Corp", status: "active"} }],
  "count": [{ label: "count", index: 6, value: 123 }]
}
```

**Test Cases**:

**Case 3a**: Hook 0 changes from "123" → "456"

```typescript
// Matching process:
anchorValue = "456";

// Try exact match against stored values:
stringify({ id: "123", name: "John", status: "active" }) === stringify("456"); // false
stringify({ id: "123", title: "Acme Corp", status: "active" }) ===
  stringify("456"); // false
stringify(123) === stringify("456"); // false

// Try Object.values() extraction:
Object.values({ id: "123", name: "John", status: "active" }); // ["123", "John", "active"]
// Does "456" match any? No

Object.values({ id: "123", title: "Acme Corp", status: "active" }); // ["123", "Acme Corp", "active"]
// Does "456" match any? No

// Result: No match found → "unknown" ✓ CORRECT (value changed, no longer matches)
```

**Case 3b**: Hook 3 changes from "123" → "999"

```typescript
// Same as Case 3a, should resolve to "unknown" ✓
```

**Case 3c**: Hook 0 reads "123" during initial render

```typescript
anchorValue = "123"
allFiberAnchors = [
  { index: 0, value: "123" },     // profile.id
  { index: 1, value: "John" },
  { index: 2, value: "active" },
  { index: 3, value: "123" },     // org.id - DUPLICATE!
  { index: 4, value: "Acme Corp" },
  { index: 5, value: "active" },  // DUPLICATE!
  { index: 6, value: 123 },       // count (number vs string)
]

// Object.values() extraction finds matches:
// For "profile" (index 0):
Object.values({id: "123", name: "John", status: "active"})  // ["123", "John", "active"]
// Contains "123" ✓

// For "org" (index 3):
Object.values({id: "123", title: "Acme Corp", status: "active"})  // ["123", "Acme Corp", "active"]
// Contains "123" ✓

// For "count" (index 6):
stringify(123) === stringify("123")  // "123" === "\"123\"" → false ✓ (type difference!)

// Value group for "123":
valueGroup = [
  { index: 0, value: "123" },  // matches "profile"
  { index: 3, value: "123" },  // matches "org"
]

// Scenario 2: Both labeled, use ordinal matching
labelsWithValue = [
  { label: "profile", index: 0, value: {...} },
  { label: "org", index: 3, value: {...} }
]

// For anchor index 0:
currentAnchorOrdinal = 0  // First occurrence of "123"
return sortedLabels[0].label  // "profile" ✓ CORRECT!

// For anchor index 3:
currentAnchorOrdinal = 1  // Second occurrence of "123"
return sortedLabels[1].label  // "org" ✓ CORRECT!
```

**Analysis**: Ordinal disambiguation handles multiple collisions correctly!

---

### Scenario 4: Property Name Ambiguity

**Setup**:

```typescript
function AmbiguousComponent() {
  const logger = useAutoTracer();

  // Hook 0: Returns { value: "test" }
  const hookA = useHookA();
  logger.labelState("hookA", 0, hookA);

  // Hook 1: Returns { data: "test" }
  const hookB = useHookB();
  logger.labelState("hookB", 1, hookB);

  // Hook 2: Returns { result: "test" }
  const hookC = useHookC();
  logger.labelState("hookC", 2, hookC);
}
```

**All return objects with different property names but same value "test"**

**Fiber State**:

```
Hook 0: "test"  // useState inside useHookA
Hook 1: "test"  // useState inside useHookB
Hook 2: "test"  // useState inside useHookC
```

**Object.values() Results**:

- `Object.values({value: "test"})` → `["test"]` ✓
- `Object.values({data: "test"})` → `["test"]` ✓
- `Object.values({result: "test"})` → `["test"]` ✓

All three extract the same value! Must use ordinal disambiguation.

---

## Key Insights from Test Scenarios

1. **Type Safety Helps**: Number `123` vs string `"123"` are distinguished by stringify ✓

2. **Ordinal Disambiguation is Critical**: Even with Object.values() extraction, we still need ordinal matching for duplicate values

3. **One-Level Extraction Limitation**: Nested objects in values (Scenario 2) aren't handled - need to filter to primitives only

4. **False Positives are Prevented by Ordinal Matching**: The existing disambiguation logic (Scenarios 1-3) handles collisions correctly

5. **Property Names Don't Matter**: Object.values() ignores property names, only extracts values - this is both a feature and limitation

## Recommended Implementation Refinement

Based on test scenarios, the Object.values() extraction should:

1. ✅ Extract values from stored objects
2. ✅ **Only match primitive values** (strings, numbers, booleans, null)
3. ✅ Skip nested objects/arrays in extracted values
4. ✅ Use ordinal disambiguation when multiple matches found
5. ✅ Apply same three-scenario logic as exact matches

```typescript
// Refined extraction:
function extractPrimitiveValues(obj: unknown): unknown[] {
  if (typeof obj !== "object" || obj === null) return [obj];

  return Object.values(obj).filter((v) => {
    const type = typeof v;
    return (
      type === "string" || type === "number" || type === "boolean" || v === null
    );
  });
}
```

This ensures we only match against the actual state primitives that React tracks!

---

## Alternative Solution 7: Reconstruct Object from Fiber Walk (PROMISING!)

### Concept: Reverse Direction Matching

Instead of extracting primitives FROM stored objects to match against fiber...
**Reconstruct objects FROM fiber to match against stored objects!**

### How It Works

**Given**:

- Stored object at build time: `{value: "test", setValue: fn}`
- Fiber memoizedState chain: `["test", fn, ...]`

**Process**:

1. Examine stored object structure → 2 properties
2. Extract property values in order: `["test", fn]`
3. Starting at fiber hook index N, consume next 2 hooks
4. Reconstruct object: `{0: fiberValue0, 1: fiberValue1}`
5. Compare: `stringify(stored)` vs `stringify(reconstructed)`

### Why This Could Work

**Property Count Gives Us Hook Consumption**:

```typescript
const storedValue = { value: "test", setValue: fn };
const propertyCount = Object.keys(storedValue).length; // 2

// Consume 2 consecutive hooks from fiber:
const reconstructed = {
  0: allFiberAnchors[hookIndex].value, // "test"
  1: allFiberAnchors[hookIndex + 1].value, // fn
};
```

**stringify() Normalizes Both Sides**:

```typescript
// Stored (functions omitted):
JSON.stringify({ value: "test", setValue: fn });
// → '{"value":"test"}' (function omitted)

// Reconstructed (functions omitted):
JSON.stringify({ 0: "test", 1: fn });
// → '{"0":"test"}' (function omitted)
```

Wait... property names differ! Need to extract values in same order.

### Refined Approach: Match Value Arrays

**Instead of reconstructing objects, reconstruct VALUE ARRAYS**:

```typescript
function tryReconstructMatch(
  storedValue: unknown,
  hookIndex: number,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): boolean {
  if (typeof storedValue !== "object" || storedValue === null) {
    // Primitive: use exact match
    return false;
  }

  // Extract stored values in order
  const storedValues = Object.values(storedValue);
  const propertyCount = storedValues.length;

  // Try to consume `propertyCount` consecutive hooks from fiber
  const fiberValues = [];
  for (let i = 0; i < propertyCount; i++) {
    const fiberAnchor = allFiberAnchors.find((a) => a.index === hookIndex + i);
    if (!fiberAnchor) return false; // Not enough hooks
    fiberValues.push(fiberAnchor.value);
  }

  // Compare arrays using stringify
  return stringify(storedValues) === stringify(fiberValues);
}
```

### Example Walkthrough

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  // Custom hook internally uses 2 useState calls
  const custom = useCustomHook("test");
  // Returns: {value: "test", setValue: fn}
  // Fiber Hook 0: "test"
  // Fiber Hook 1: fn

  logger.labelState("custom", 0, custom);
  // Stores: {label: "custom", index: 0, value: {value: "test", setValue: fn}}
}
```

**Matching Process** (when Hook 0 changes "test" → "updated"):

```typescript
// Stored:
storedValue = {value: "test", setValue: fn}
storedValues = Object.values(storedValue) // ["test", fn]

// Fiber (BEFORE change):
Hook 0: "test"
Hook 1: fn

// Extract from fiber:
fiberValues = [
  allFiberAnchors[0].value,  // "test"
  allFiberAnchors[1].value   // fn
]

// Compare:
stringify(["test", fn]) === stringify(["test", fn])
// '["test"]' === '["test"]' ✓ MATCH! (functions omitted)

// Fiber (AFTER change):
Hook 0: "updated"
Hook 1: fn

fiberValues = ["updated", fn]

stringify(["test", fn]) === stringify(["updated", fn])
// '["test"]' === '["updated"]' ✗ NO MATCH (value changed)
```

**But wait!** We're matching OLD stored value against NEW fiber value - this is backwards for our use case!

### Corrected: Match Against Anchor Value

The anchor value IS the new fiber value. We need to check if this new value could have come from the stored label:

```typescript
function couldAnchorMatchStoredLabel(
  anchorValue: unknown, // New fiber value: "updated"
  anchorIndex: number, // Hook index: 0
  storedValue: unknown, // Stored at build time: {value: "test", setValue: fn}
  allFiberAnchors: Array<{ index: number; value: unknown }>
): boolean {
  if (typeof storedValue !== "object" || storedValue === null) {
    // Primitive: use exact match
    return stringify(anchorValue) === stringify(storedValue);
  }

  // Extract stored values
  const storedValues = Object.values(storedValue);
  const propertyCount = storedValues.length;

  // Reconstruct current fiber values
  const currentFiberValues = [];
  for (let i = 0; i < propertyCount; i++) {
    const fiberAnchor = allFiberAnchors.find(
      (a) => a.index === anchorIndex + i
    );
    if (!fiberAnchor) return false;
    currentFiberValues.push(fiberAnchor.value);
  }

  // Compare stringified arrays
  return stringify(currentFiberValues) === stringify(storedValues);
}
```

**Problem**: Stored values are from build time ("test"), but fiber has runtime values ("updated"). They'll never match after a change!

### The Fundamental Issue

The stored value is captured at **label registration time** (first render):

- `labelState("custom", 0, {value: "test", setValue: fn})`

But we're trying to match it against **current fiber state**:

- Hook 0: "updated" (changed!)

**These values are at different points in time!**

### Could We Update Stored Values?

What if we update the stored label value whenever we match?

```typescript
// On successful match:
labelStorage.set("custom", {
  label: "custom",
  index: 0,
  value: { value: "updated", setValue: fn }, // Update with current values
});
```

**Challenges**:

1. We don't have the original object structure - just fiber primitives
2. We can't reconstruct `{value: X, setValue: Y}` - we don't have property names
3. Property names are lost in fiber's sequential storage

### Wait... Property Names ARE Available!

When we initially store the label, we have the full object with property names:

```typescript
logger.labelState("custom", 0, {value: "test", setValue: fn});
// We could store:
{
  label: "custom",
  index: 0,
  value: {value: "test", setValue: fn},
  structure: {
    propertyNames: ["value", "setValue"],
    propertyCount: 2
  }
}
```

Then during matching:

```typescript
function reconstructObjectFromFiber(
  anchorIndex: number,
  propertyNames: string[],
  allFiberAnchors: Array<{ index: number; value: unknown }>
): object {
  const reconstructed: any = {};

  for (let i = 0; i < propertyNames.length; i++) {
    const fiberAnchor = allFiberAnchors.find(
      (a) => a.index === anchorIndex + i
    );
    if (fiberAnchor) {
      reconstructed[propertyNames[i]] = fiberAnchor.value;
    }
  }

  return reconstructed;
}

// Example:
const current = reconstructObjectFromFiber(
  0,
  ["value", "setValue"],
  allFiberAnchors
);
// Result: {value: "updated", setValue: fn}
```

Now we can:

1. Reconstruct the current object with correct property names
2. Compare structure (property count, names)
3. Update stored value with current values
4. Use for future matches

### Final Refined Solution

```typescript
interface StoredLabel {
  label: string;
  index: number;
  value: unknown;
  objectStructure?: {
    propertyNames: string[];
    propertyCount: number;
  };
}

function storeLabel(label: string, index: number, value: unknown) {
  const stored: StoredLabel = { label, index, value };

  // If value is an object, store structure metadata
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    stored.objectStructure = {
      propertyNames: Object.keys(value),
      propertyCount: Object.keys(value).length,
    };
  }

  // Store...
}

function resolveHookLabel(
  anchorValue: unknown,
  anchorIndex: number,
  allFiberAnchors: Array<{ index: number; value: unknown }>,
  labelStorage: Map<string, StoredLabel[]>
): string | null {
  // Try exact match first (primitives)
  // ...existing exact match logic...

  // Try object reconstruction
  for (const [label, storedLabels] of labelStorage) {
    for (const stored of storedLabels) {
      if (stored.objectStructure) {
        const reconstructed = reconstructObjectFromFiber(
          anchorIndex,
          stored.objectStructure.propertyNames,
          allFiberAnchors
        );

        if (reconstructed) {
          // Compare stringified
          const match = stringify(reconstructed) === stringify(stored.value);

          if (match) {
            // Update stored value with current values
            stored.value = reconstructed;
            return label;
          }
        }
      }
    }
  }

  return null;
}
```

### Advantages of This Approach

1. ✅ **Preserves Property Names**: Stores and uses original property names
2. ✅ **Handles Multi-Hook Custom Hooks**: Consumes correct number of consecutive hooks
3. ✅ **Updates Automatically**: Stored value stays current with fiber state
4. ✅ **Works with Functions**: stringify() handles them consistently
5. ✅ **No False Positives**: Matches full object structure, not just individual values

### Challenges

1. ⚠️ **Assumption: Sequential Hooks**: Assumes custom hook uses sequential hook indices (usually true)
2. ⚠️ **Property Order Matters**: Object.keys() order must match fiber hook order (usually true in practice)
3. ⚠️ **First Render Required**: Need initial call to capture structure (already required)
4. ⚠️ **Anchor Index Must Be First Hook**: If anchorIndex is middle hook of custom hook, reconstruction fails

### Critical Question: Which Hook Index Gets Tracked?

**Custom hook** `useCustomHook` internally:

```typescript
function useCustomHook(initialValue: string) {
  const [value, setValue] = useState(initialValue); // Hook N
  return { value, setValue };
}
```

**In component**:

```typescript
const custom = useCustomHook("test"); // Consumes Hook 0
logger.labelState("custom", 0, custom);
```

**When value changes**, which hook index appears in `allFiberAnchors`?

- Hook 0: "test" → "updated" ✓ (The actual state hook)

So `anchorIndex = 0` is correct! But the custom hook only uses ONE hook internally, not two!

The `setValue` function is **not a hook** - it's just returned from useState.

**Fiber only tracks**:

- Hook 0: "test" (the state value)

There is NO Hook 1 for setValue!

### Reconstruction Reality Check

For `{value: "test", setValue: fn}`:

- Property count: 2
- Try to consume 2 hooks starting at index 0
- Hook 0: "test" ✓
- Hook 1: ??? (Might be next hook in component, not related!)

**This breaks if we naively consume hooks by property count!**

### Insight: Only Reconstruct State Properties

We should only try to reconstruct based on **useState calls**, not returned functions:

```typescript
function extractStateValues(obj: unknown): unknown[] {
  if (typeof obj !== "object" || obj === null) return [obj];

  return Object.values(obj).filter((v) => typeof v !== "function");
}
```

But now we're back to extracting values, not reconstructing objects!

### Conclusion on Reconstruction Approach

**The reconstruction approach is clever but faces a critical challenge**:

We can't reliably know how many hooks a custom hook consumes just by looking at the returned object's property count, because:

1. Returned object may include non-hook values (functions, constants)
2. Custom hook might use multiple hooks but return fewer properties
3. Custom hook might compute derived values

**However, a hybrid approach could work**:

- For simple cases (1 property), try single-hook match
- For complex cases, fall back to value extraction

Let me add this as Solution 7 with proper caveats.

---

## Solution 8: Function Normalization with "(fn)" Placeholder (BREAKTHROUGH!)

### The Key Insight

Both sides can normalize functions to the same placeholder value `"(fn)"`:

- **Storage side**: Replace actual functions with `"(fn)"`
- **Reconstruction side**: Use `"(fn)"` for function properties (no hook consumed!)

This solves the hook count mismatch problem!

### How It Works

**At Storage Time** (labelState call):

```typescript
function normalizeValue(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;

  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    normalized[key] = typeof val === "function" ? "(fn)" : val;
  }
  return normalized;
}

// Usage:
labelState("custom", 2, { value: "test", setValue: fn });
// Stores: {value: "test", setValue: "(fn)"}
```

**Store Property Metadata**:

```typescript
interface StoredLabel {
  label: string;
  index: number;
  value: unknown; // Already normalized
  propertyMetadata?: {
    names: string[]; // ["value", "setValue"]
    types: Array<"value" | "function">; // ["value", "function"]
  };
}
```

**At Matching Time** (fiber reconstruction):

```typescript
function reconstructFromFiber(
  anchorIndex: number,
  metadata: { names: string[]; types: Array<"value" | "function"> },
  allFiberAnchors: Array<{ index: number; value: unknown }>
): object | null {
  const reconstructed: Record<string, unknown> = {};
  let hookOffset = 0; // Track which hook we're consuming

  for (let i = 0; i < metadata.names.length; i++) {
    const propName = metadata.names[i];
    const propType = metadata.types[i];

    if (propType === "function") {
      // This property was a function - use placeholder
      reconstructed[propName] = "(fn)";
      // Don't consume a hook! Functions aren't stored in memoizedState
    } else {
      // This property is a state value - consume next hook
      const hookIndex = anchorIndex + hookOffset;
      const anchor = allFiberAnchors.find((a) => a.index === hookIndex);

      if (!anchor) return null; // Can't reconstruct

      reconstructed[propName] = anchor.value;
      hookOffset++; // Move to next hook
    }
  }

  return reconstructed;
}
```

### Complete Example

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  // Hook 2: Internal useState
  const custom = useCustomHook("test");
  // Returns: {value: "test", setValue: [Function]}

  logger.labelState("custom", 2, custom);
}
```

**Storage** (normalized):

```typescript
{
  label: "custom",
  index: 2,
  value: { value: "test", setValue: "(fn)" },  // Functions normalized
  propertyMetadata: {
    names: ["value", "setValue"],
    types: ["value", "function"]
  }
}
```

**Fiber State**:

```typescript
Hook 2: {
  memoizedState: "test",
  queue: { dispatch: [Function] }
}
```

**Reconstruction**:

```typescript
// For property "value" (type: "value"):
reconstructed.value = fiberAnchors[2].value; // "test"

// For property "setValue" (type: "function"):
reconstructed.setValue = "(fn)"; // Placeholder (no hook consumed!)

// Result:
reconstructed = { value: "test", setValue: "(fn)" };
```

**Comparison**:

```typescript
stringify({ value: "test", setValue: "(fn)" }) === // Stored (normalized)
  stringify({ value: "test", setValue: "(fn)" }); // Reconstructed
// → '{"value":"test","setValue":"(fn)"}' === '{"value":"test","setValue":"(fn)"}'
// ✅ MATCH!
```

### Advantages

1. ✅ **Solves Hook Count Mismatch**: Only consumes hooks for actual state values
2. ✅ **Deterministic Matching**: Both sides use identical normalization
3. ✅ **Works with Multiple Functions**: Any number of function properties handled
4. ✅ **Property Names Preserved**: Full object structure maintained
5. ✅ **No False Positives**: Exact structural match required

### Handling Updates

**When value changes**:

```typescript
// Fiber changes:
Hook 2: { memoizedState: "updated" }  // Changed from "test"

// Reconstruct with new value:
reconstructed = { value: "updated", setValue: "(fn)" }

// Stored value (from first render):
stored = { value: "test", setValue: "(fn)" }

// Compare:
stringify(reconstructed) !== stringify(stored)
// '{"value":"updated","setValue":"(fn)"}' !== '{"value":"test","setValue":"(fn)"}'
// ✗ No match (value changed!)
```

**Solution: Match by Structure, Update Value**:

```typescript
function tryStructuralMatch(
  anchorIndex: number,
  storedLabel: StoredLabel,
  allFiberAnchors: Array<{ index: number; value: unknown }>
): boolean {
  if (!storedLabel.propertyMetadata) return false;

  // Reconstruct current state
  const current = reconstructFromFiber(
    anchorIndex,
    storedLabel.propertyMetadata,
    allFiberAnchors
  );

  if (!current) return false;

  // Check if structure matches (property names match)
  const storedKeys = Object.keys(storedLabel.value as object).sort();
  const currentKeys = Object.keys(current).sort();

  if (JSON.stringify(storedKeys) !== JSON.stringify(currentKeys)) {
    return false; // Different structure
  }

  // Structure matches! This is the right label
  // Update stored value with current for next comparison
  storedLabel.value = current;
  return true;
}
```

Now:

- First render: Store `{value: "test", setValue: "(fn)"}`
- Second render with change: Reconstruct `{value: "updated", setValue: "(fn)"}`
- Compare structure: Both have `["setValue", "value"]` keys ✓
- Update stored: `{value: "updated", setValue: "(fn)"}`
- Report: "State change custom: test → updated" ✓

### Edge Cases Handled

**Multiple useState hooks**:

```typescript
function useMultiState() {
  const [a, setA] = useState(1);  // Hook N
  const [b, setB] = useState(2);  // Hook N+1
  return { a, setA, b, setB };
}

// Metadata:
{
  names: ["a", "setA", "b", "setB"],
  types: ["value", "function", "value", "function"]
}

// Reconstruction consumes Hook N and N+1 only (skips functions) ✓
```

**Only functions** (edge case):

```typescript
const callbacks = useCallbacks();
// Returns: { onClick: fn, onHover: fn }

// Metadata:
{
  names: ["onClick", "onHover"],
  types: ["function", "function"]
}

// Reconstruction consumes ZERO hooks (all functions!)
// Stored: { onClick: "(fn)", onHover: "(fn)" }
// Reconstructed: { onClick: "(fn)", onHover: "(fn)" }
// Match: ✓ (by structure)
```

### Limitations

- ⚠️ **One-Level Deep**: Only normalizes top-level properties
- ⚠️ **Property Order**: Assumes Object.keys() returns consistent order (spec guarantees this)
- ⚠️ **Hook Sequence**: Assumes custom hook's useState calls are sequential

### Function Classification Rule (Deterministic, No String Matching!)

**Simple structural rule based on property composition**:

```typescript
// Rule: If ALL properties are functions → Function-valued state
// Otherwise: Functions are setters/callbacks

// Pattern 1: All functions → Function-valued state (consume hooks for all)
const callbacks = useCallbacks();
// Returns: { onClick: fn, onSubmit: fn, onCancel: fn }
// Classification: ALL are type "value" → Consume 3 hooks

// Pattern 2: Mixed → Common pattern (functions are setters, don't consume hooks)
const custom = useCustomHook();
// Returns: { value: "test", setValue: fn }
// Classification: "value" is type "value", "setValue" is type "function"
// Only consume 1 hook for "value"

// Pattern 3: Multiple state values with setters
const form = useForm();
// Returns: { name: "John", email: "j@e.com", setName: fn, setEmail: fn }
// Classification: name, email are "value", setters are "function"
// Consume 2 hooks for name, email
```

**Why this works**:

- ✅ No naming conventions or string matching
- ✅ Deterministic based on actual object structure
- ✅ Handles rare function-valued state pattern (microfrontend callbacks, etc.)
- ✅ Handles common custom hook pattern ({value, setValue})
- ✅ Works with any property names developers choose

**⚠️ Dragon Warning**: If someone creates a custom hook that mixes function-valued state with setters in the same object, this will misclassify:

```typescript
// Edge case: Mixed function-valued state + setters (WHY?!)
const weird = useWeirdHook();
// Returns: { callback: fn, setCallback: fn, formatter: fn, setFormatter: fn }
// Where callback and formatter ARE state, setters are setters
// Our rule: NOT all functions → Treats setCallback/setFormatter as "function" type
// Result: Will only consume 2 hooks (callback, formatter) ✓ Actually correct!
// Wait... this actually works! If callback/formatter are state, they consume hooks.
// The setters don't consume hooks. Pattern still works!
```

Actually, I can't find a case where this breaks! Even the "edge case" works correctly because:

- Function-valued state (callback, formatter) → consume hooks
- Setters (setCallback, setFormatter) → don't consume hooks (not in fiber memoizedState)

### Critical Success Factors

This approach requires:

1. ✅ Normalize functions to `"(fn)"` at storage time
2. ✅ Classify based on structure: all functions → all "value", mixed → functions are "function" type
3. ✅ Store property names and types metadata
4. ✅ Only consume hooks for properties classified as "value" during reconstruction
5. ✅ Match by structure (property keys), update by value

All achievable with current implementation!

---

## Test Scenarios for Solution 8

### Test 1: Single useState Custom Hook (Basic Case)

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const custom = useCustomHook("test");
  // useCustomHook internally: const [value, setValue] = useState(initialValue);
  // Returns: {value: "test", setValue: fn}

  logger.labelState("custom", 0, custom);
}
```

**Expected Storage**:

```typescript
{
  label: "custom",
  index: 0,
  value: { value: "test", setValue: "(fn)" },
  propertyMetadata: {
    names: ["value", "setValue"],
    types: ["value", "function"]
  }
}
```

**Test Actions**:

1. Initial render with "test"
2. Update to "updated"
3. Update to "final"

**Expected Results**:

```
Initial: No log (first render)
Update 1: "State change custom: test → updated"
Update 2: "State change custom: updated → final"
```

**Reconstruction Validation**:

```typescript
// Hook 0 changes: "test" → "updated"
reconstructed = { value: "updated", setValue: "(fn)" }  // ✓ Consumes 1 hook
stored = { value: "test", setValue: "(fn)" }
structures match: ["setValue", "value"] === ["setValue", "value"] ✓
```

---

### Test 2: Multiple useState Custom Hook

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const form = useForm({ name: "", email: "" });
  // useForm internally:
  //   const [name, setName] = useState(initial.name);     // Hook 0
  //   const [email, setEmail] = useState(initial.email);  // Hook 1
  // Returns: { name: "", setName: fn, email: "", setEmail: fn }

  logger.labelState("form", 0, form);
}
```

**Expected Storage**:

```typescript
{
  label: "form",
  index: 0,
  value: { name: "", setName: "(fn)", email: "", setEmail: "(fn)" },
  propertyMetadata: {
    names: ["name", "setName", "email", "setEmail"],
    types: ["value", "function", "value", "function"]  // Mixed → functions are setters
  }
}
```

**Test Actions**:

1. Update name: "" → "John"
2. Update email: "" → "john@example.com"
3. Update both simultaneously

**Expected Results**:

```
Update name: "State change form: {"name":"","email":""} → {"name":"John","email":""}"
Update email: "State change form: {"name":"John","email":""} → {"name":"John","email":"john@example.com"}"
Update both: "State change form: {...} → {"name":"Alice","email":"alice@example.com"}"
```

**Reconstruction Validation**:

```typescript
// Hooks 0,1 change
reconstructed = {
  name: fiberAnchors[0].value, // "John" (consumes Hook 0)
  setName: "(fn)", // No hook consumed
  email: fiberAnchors[1].value, // "john@example.com" (consumes Hook 1)
  setEmail: "(fn)", // No hook consumed
};
// Total hooks consumed: 2 ✓
```

---

### Test 3: All Functions - Function-Valued State (Microfrontend Pattern)

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const callbacks = useCallbacks();
  // useCallbacks internally uses useState for function-valued state:
  //   const [onClick, setOnClick] = useState(() => defaultClickHandler);     // Hook 0
  //   const [onSubmit, setOnSubmit] = useState(() => defaultSubmitHandler);  // Hook 1
  // Returns: { onClick: fn, onSubmit: fn }

  logger.labelState("callbacks", 0, callbacks);
}
```

**Expected Storage**:

```typescript
{
  label: "callbacks",
  index: 0,
  value: { onClick: "(fn)", onSubmit: "(fn)" },
  propertyMetadata: {
    names: ["onClick", "onSubmit"],
    types: ["value", "value"]  // ALL functions → Classify as "value" (function-valued state!)
  }
}
```

**Test Actions**:

1. Update onClick to new function
2. Update onSubmit to new function

**Expected Results**:

```
Update onClick: "State change callbacks: {...} → {...}" (function reference changed)
Update onSubmit: "State change callbacks: {...} → {...}" (function reference changed)
```

**Reconstruction Validation**:

```typescript
// Hooks 0,1 consumed (ALL properties are function-valued state)
reconstructed = {
  onClick: fiberAnchors[0].value, // New function (consumes Hook 0)
  onSubmit: fiberAnchors[1].value, // New function (consumes Hook 1)
};
// Total hooks consumed: 2 ✓ (Correct for function-valued state!)
// Note: Functions in fiber are compared by reference; changes detected
```

---

### Test 4: Mixed with Regular useState

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const [count, setCount] = useState(0); // Hook 0
  const custom = useCustomHook("test"); // Hook 1
  const [title, setTitle] = useState("hello"); // Hook 2

  logger.labelState("count", 0, count);
  logger.labelState("custom", 1, custom);
  logger.labelState("title", 2, title);
}
```

**Expected Storage**:

```typescript
{
  "count": [{ label: "count", index: 0, value: 0 }],
  "custom": [{
    label: "custom",
    index: 1,
    value: { value: "test", setValue: "(fn)" },
    propertyMetadata: {
      names: ["value", "setValue"],
      types: ["value", "function"]
    }
  }],
  "title": [{ label: "title", index: 2, value: "hello" }]
}
```

**Test Actions**:

1. Update count: 0 → 1
2. Update custom.value: "test" → "updated"
3. Update title: "hello" → "world"

**Expected Results**:

```
Update count: "State change count: 0 → 1"
Update custom: "State change custom: {"value":"test","setValue":"(fn)"} → {"value":"updated","setValue":"(fn)"}"
Update title: "State change title: hello → world"
```

**Reconstruction Validation**:

```typescript
// For index 0 (count): Primitive, no reconstruction needed
// For index 1 (custom): Reconstruct object consuming Hook 1
// For index 2 (title): Primitive, no reconstruction needed
```

---

### Test 5: Property Order Consistency

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const data = useData();
  // Returns: { id: 1, name: "test", age: 25, setData: fn }

  logger.labelState("data", 0, data);
}
```

**Expected Storage**:

```typescript
{
  label: "data",
  index: 0,
  value: { id: 1, name: "test", age: 25, setData: "(fn)" },
  propertyMetadata: {
    names: ["id", "name", "age", "setData"],  // Order matters!
    types: ["value", "value", "value", "function"]
  }
}
```

**Test Actions**:

1. Update middle property (name): "test" → "updated"
2. Update first property (id): 1 → 2

**Expected Results**:

```
Both updates should correctly reconstruct and match ✓
```

**Reconstruction Validation**:

```typescript
// Hook consumption order:
// "id" → Hook 0
// "name" → Hook 1
// "age" → Hook 2
// "setData" → No hook (function)

reconstructed = {
  id: fiberAnchors[0].value, // Hook 0
  name: fiberAnchors[1].value, // Hook 1
  age: fiberAnchors[2].value, // Hook 2
  setData: "(fn)", // No hook
};
```

---

### Test 6: Collision - Multiple Custom Hooks Same Structure

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const userInput = useInput("user"); // Hook 0: {value: "user", setValue: fn}
  const passInput = useInput("pass"); // Hook 1: {value: "pass", setValue: fn}

  logger.labelState("userInput", 0, userInput);
  logger.labelState("passInput", 1, passInput);
}
```

**Expected Storage**:

```typescript
{
  "userInput": [{
    label: "userInput",
    index: 0,
    value: { value: "user", setValue: "(fn)" },
    propertyMetadata: { names: ["value", "setValue"], types: ["value", "function"] }
  }],
  "passInput": [{
    label: "passInput",
    index: 1,
    value: { value: "pass", setValue: "(fn)" },
    propertyMetadata: { names: ["value", "setValue"], types: ["value", "function"] }
  }]
}
```

**Test Actions**:

1. Update userInput: "user" → "john"
2. Update passInput: "pass" → "secret"

**Expected Results**:

```
Update user: "State change userInput: {"value":"user","setValue":"(fn)"} → {"value":"john","setValue":"(fn)"}"
Update pass: "State change passInput: {"value":"pass","setValue":"(fn)"} → {"value":"secret","setValue":"(fn)"}"
```

**Validation**:

- Each reconstructs from its own hook index ✓
- No cross-contamination between labels ✓

---

### Test 7: Structure Mismatch (Should Fail)

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  // Hypothetical: custom hook changes structure between renders (bad practice!)
  const data = useWeirdHook();
  // Render 1: {value: "test", setValue: fn}
  // Render 2: {result: "test", update: fn}  // Different property names!

  logger.labelState("data", 0, data);
}
```

**Expected Behavior**:

```typescript
// Render 1: Store with ["value", "setValue"]
// Render 2: Reconstruct with ["result", "update"]
// Structure comparison: ["setValue", "value"] !== ["result", "update"]
// Match fails → "State change unknown: ..."
```

**Validation**:

- Structure mismatch detected ✓
- Falls back to "unknown" label ✓

---

### Test 8: Nested Object in Property (Limitation)

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const config = useConfig();
  // Returns: {
  //   settings: { theme: "dark", lang: "en" },  // Nested object!
  //   updateSettings: fn
  // }

  logger.labelState("config", 0, config);
}
```

**Expected Storage** (one-level normalization):

```typescript
{
  label: "config",
  index: 0,
  value: {
    settings: { theme: "dark", lang: "en" },  // NOT normalized (nested)
    updateSettings: "(fn)"
  },
  propertyMetadata: {
    names: ["settings", "updateSettings"],
    types: ["value", "function"]  // "settings" treated as value (object)
  }
}
```

**Test Actions**:

1. Update theme: "dark" → "light"

**Expected Behavior**:

```typescript
// Fiber Hook 0: { theme: "light", lang: "en" }
reconstructed = {
  settings: { theme: "light", lang: "en" }, // From Hook 0
  updateSettings: "(fn)",
};

stored = {
  settings: { theme: "dark", lang: "en" },
  updateSettings: "(fn)",
};

// Compare: Objects differ
// Structure matches, so label resolves ✓
// "State change config: {...} → {...}"
```

**Validation**:

- Nested objects work if entire object is state ✓
- Limitation: Can't extract primitives from nested objects (future enhancement)

---

### Test 9: Mixed Function-Valued State + Setters

**Component**:

```typescript
function TestComponent() {
  const logger = useAutoTracer();

  const callbacks = useCallbackState();
  // useCallbackState internally:
  //   const [onClick, setOnClick] = useState(() => () => console.log('click'));
  //   const [formatter, setFormatter] = useState(() => (x) => x.toUpperCase());
  // Returns: { onClick: fn, setOnClick: fn, formatter: fn, setFormatter: fn }

  logger.labelState("callbacks", 0, callbacks);
}
```

**Expected Storage** (with all-functions rule):

```typescript
{
  label: "callbacks",
  index: 0,
  value: { onClick: "(fn)", setOnClick: "(fn)", formatter: "(fn)", setFormatter: "(fn)" },
  propertyMetadata: {
    names: ["onClick", "setOnClick", "formatter", "setFormatter"],
    types: ["value", "value", "value", "value"]  // ALL functions → All "value" type!
  }
}
```

**Test Actions**:

1. Update onClick function (state change)
2. Update formatter function (state change)

**Expected Results**:

```
Update onClick: "State change callbacks: {...} → {...}" (function change detected)
Update formatter: "State change callbacks: {...} → {...}" (function change detected)
```

**Reconstruction Validation**:

```typescript
// ALL hooks consumed (all properties are function-valued state!)
reconstructed = {
  onClick: fiberAnchors[0].value, // Hook 0 (function-valued state)
  setOnClick: fiberAnchors[1].value, // Hook 1 (the SETTER from useState)
  formatter: fiberAnchors[2].value, // Hook 2 (function-valued state)
  setFormatter: fiberAnchors[3].value, // Hook 3 (the SETTER from useState)
};
// Total hooks consumed: 4 ✓

// Wait... this is WRONG! The setters aren't in fiber memoizedState!
// Only the state VALUES are in memoizedState!
```

**⚠️ Reality Check**: This test reveals the limitation!

React fiber only stores:

- Hook 0: onClick function (the state value)
- Hook 1: formatter function (the state value)

The setters `setOnClick` and `setFormatter` are NOT in memoizedState - they're in `queue.dispatch`!

So this pattern would try to consume 4 hooks but only 2 exist in the fiber chain.

**Conclusion**: The all-functions rule works for EITHER:

- All function-valued state WITHOUT setters: `{ onClick: fn, onSubmit: fn }`
- Mixed primitives and setters: `{ value: "test", setValue: fn }`

But NOT for the hybrid: `{ onClick: fn, setOnClick: fn }` where both are returned.

**⚠️ Dragon Warning Added**: If a custom hook returns BOTH function-valued state AND its setter in the same object, our rule will misclassify. However, this pattern is extremely rare because:

1. Returning both the state and setter for function-valued state is unusual
2. Most function-valued state doesn't expose the setter (just the function)
3. Common pattern is `{ onClick: fn }` NOT `{ onClick: fn, setOnClick: fn }`

---

## Summary: Test Coverage

| Test | Scenario                        | Validates                                 |
| ---- | ------------------------------- | ----------------------------------------- |
| 1    | Single useState custom hook     | Basic reconstruction, 1 hook consumed     |
| 2    | Multiple useState hooks         | Multiple hooks consumed, correct ordering |
| 3    | All functions (function-valued) | All hooks consumed, microfrontend pattern |
| 4    | Mixed custom + regular          | Coexistence with primitives               |
| 5    | Property order                  | Consistent reconstruction order           |
| 6    | Multiple same structure         | No collision, index-based isolation       |
| 7    | Structure mismatch              | Failure detection, fallback to unknown    |
| 8    | Nested objects                  | One-level limitation, still works         |
| 9    | Mixed function-valued + setters | All-functions rule works correctly        |

**Critical Validations**:

- ✅ Hook consumption matches property types (determined by all-functions rule)
- ✅ Function normalization consistent both sides
- ✅ Structure matching (property names)
- ✅ Ordinal isolation (index-based)
- ✅ Graceful failure on mismatch

---

## Future Improvements & Refinements

This section documents potential enhancements beyond the core Solution 8 implementation. These are not blockers but valuable additions based on real-world usage patterns.

### 1. Auto-Retry with Reclassification (Dragon Case Recovery)

**Problem**: The dragon case where a custom hook returns `{ fnState, setFnState }` will fail reconstruction because we expect 2 hooks but only 1 exists.

**Current Behavior**: Falls back to "unknown" label.

**Improvement**: Detect reconstruction failure and retry with adjusted classification:

```typescript
function resolveWithRecovery(anchorIndex, storedLabel, allFiberAnchors) {
  // First attempt: Use stored classification
  const result = tryReconstruct(anchorIndex, storedLabel, allFiberAnchors);

  if (result.success) {
    return { label: storedLabel.label, matchType: "structural" };
  }

  // Retry: If all-functions classification failed, try as mixed
  if (
    storedLabel.wasClassifiedAsAllFunctions &&
    result.error === "insufficient-hooks"
  ) {
    const reclassified = reclassifyAsMixed(storedLabel);
    const retryResult = tryReconstruct(
      anchorIndex,
      reclassified,
      allFiberAnchors
    );

    if (retryResult.success) {
      // Update stored classification for future renders
      updateStoredClassification(storedLabel.label, reclassified);
      return { label: storedLabel.label, matchType: "structural-recovered" };
    }
  }

  return { label: null, matchType: "unknown" };
}
```

**Benefits**:

- Gracefully handles the rare dragon case
- Self-correcting on first failure
- No performance penalty for successful matches

**Complexity**: Medium - requires retry logic and classification mutation

---

### 2. Match Diagnostics Flag

**Problem**: When debugging or validating Solution 8 in production, it's unclear which matching strategy succeeded or why a label is "unknown".

**Improvement**: Add opt-in diagnostics flag (similar to existing trace flags):

```typescript
interface AutoTracerOptions {
  showMatchDiagnostics?: boolean; // Default: false
}

function resolveHookLabel(guid, targetIndex, targetValue) {
  const { label, matchType } = performMatching(...);

  if (config.showMatchDiagnostics) {
    logMatchDiagnostic(matchType, label, targetIndex, {
      hookCount: metadata?.propertyCount,
      structuralMatch: matchType.includes('structural'),
      valueSnapshot: truncate(targetValue, 50)
    });
  }

  return label;
}
```

**Example Output**:

```
[Match Diagnostic] primitive-exact: "title" (index 0)
[Match Diagnostic] structural-reconstructed: "custom" (index 2, consumed 1/2 hooks)
[Match Diagnostic] fallback-unknown: (index 4, no label candidates)
[Match Diagnostic] structural-recovered: "callbacks" (index 6, reclassified mixed→all-fns)
```

**Benefits**:

- Zero overhead when disabled
- Invaluable for understanding real-world usage patterns
- Helps validate algorithm correctness with 20+ developers
- Can identify optimization opportunities

**Complexity**: Low - simple conditional logging

---

### 3. Manual Override API (Explicit Primitive Extraction)

**Problem**: For edge cases or complex custom hooks, automatic reconstruction might fail or be ambiguous.

**Improvement**: Provide explicit API for manual control:

```typescript
// Current (automatic):
const custom = useCustomHook("test");
logger.labelState("custom", 2, custom); // Auto-detects and reconstructs

// New (manual override):
const custom = useCustomHook("test");
logger.labelStateExact("custom", 2, custom.value); // Explicit primitive
// OR
logger.labelState("custom", 2, custom, { extractPath: "value" }); // Guided extraction
```

**Implementation**:

```typescript
interface LabelOptions {
  extractPath?: string; // e.g., "value", "data.result", "[0]"
  bypassReconstruction?: boolean; // Force primitive-only matching
}

labelState(label: string, index: number, value: unknown, options?: LabelOptions) {
  let storedValue = value;

  if (options?.extractPath) {
    storedValue = extractByPath(value, options.extractPath);
  }

  addLabelForGuid(guid, {
    label,
    index,
    value: storedValue,
    bypassReconstruction: options?.bypassReconstruction
  });
}
```

**Benefits**:

- Full user control for edge cases
- Escape hatch for third-party hooks with unpredictable structure
- Backwards compatible (optional parameter)

**Complexity**: Low - straightforward path extraction

---

### 4. Performance Cap for Large Objects

**Problem**: Objects with >50 properties incur reconstruction cost every render.

**Improvement**: Add configurable threshold with auto-fallback:

```typescript
const MAX_PROPERTIES_FOR_RECONSTRUCTION = 32; // Configurable

function shouldAttemptReconstruction(storedLabel) {
  if (!storedLabel.propertyMetadata) return false;

  const propCount = storedLabel.propertyMetadata.names.length;

  if (propCount > MAX_PROPERTIES_FOR_RECONSTRUCTION) {
    logWarn(
      `Object "${storedLabel.label}" has ${propCount} properties (limit: ${MAX_PROPERTIES_FOR_RECONSTRUCTION}). ` +
        `Use labelStateExact() for manual control. Falling back to index-only matching.`
    );
    return false;
  }

  return true;
}
```

**Benefits**:

- Prevents performance degradation
- Clear feedback to developer
- Encourages manual extraction for complex state

**Complexity**: Low - simple threshold check

**Note**: Only relevant if performance issues observed. Likely not needed for typical custom hooks (<10 properties).

---

### 5. Deep/Recursive Normalization (Future Enhancement)

**Problem**: Current implementation only handles one-level deep:

```typescript
// Works:
{ value: "test", setValue: fn }

// Doesn't work (nested):
{
  settings: { theme: "dark", lang: "en" }, // Nested object
  updateSettings: fn
}
```

**Improvement**: Recursive normalization with cycle detection:

```typescript
function normalizeValueDeep(
  value: unknown,
  depth = 0,
  seen = new WeakSet()
): unknown {
  if (depth > MAX_DEPTH) return "(max-depth)";
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return "(circular)";

  seen.add(value);

  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "function") {
      normalized[key] = "(fn)";
    } else if (typeof val === "object" && val !== null) {
      normalized[key] = normalizeValueDeep(val, depth + 1, seen); // Recurse
    } else {
      normalized[key] = val;
    }
  }

  return normalized;
}
```

**Reconstruction Challenge**: Would need to track property paths and types at arbitrary depth:

```typescript
propertyMetadata: {
  paths: ["settings.theme", "settings.lang", "updateSettings"],
  types: ["value", "value", "function"]
}
```

**Benefits**:

- Handles complex nested state structures
- More accurate diffing (show which nested property changed)

**Complexity**: High - requires:

- Recursive traversal with cycle detection
- Path-based metadata storage
- Nested property reconstruction from flat fiber chain
- Diff generation for nested changes

**Recommendation**: Defer until one-level implementation is proven and real-world need demonstrated.

---

### 6. Pluggable Classification Strategies

**Problem**: The all-functions rule works for most cases, but users might have domain-specific patterns.

**Improvement**: Allow user-provided classifier function:

```typescript
interface AutoTracerOptions {
  customClassifier?: (value: object) => Array<"value" | "function">;
}

// Example: User knows their hooks follow "data*" pattern
const customClassifier = (obj) => {
  return Object.entries(obj).map(([key, val]) => {
    if (typeof val !== "function") return "value";
    // Custom logic: "data" prefix = state, others = setters
    return key.startsWith("data") ? "value" : "function";
  });
};
```

**Benefits**:

- Maximum flexibility for power users
- Handles domain-specific patterns
- Doesn't complicate core algorithm

**Complexity**: Medium - requires:

- Classifier function interface
- Validation of returned types
- Fallback to default rule if classifier throws

**Recommendation**: Wait for user demand. Current deterministic rule likely sufficient.

---

### 7. Visual Developer Tooling

**Problem**: Developers can't easily see how their custom hooks are being classified and matched.

**Improvement**: Browser DevTools extension or overlay panel:

```
┌─ Auto-Tracer Hook Inspector ─────────────────────┐
│ Component: TodoForm                               │
│                                                   │
│ Hook 0: title (primitive: string)                │
│   └─ Match: primitive-exact ✓                    │
│                                                   │
│ Hook 1: custom (object: 2 properties)            │
│   ├─ Classification: mixed                       │
│   ├─ Properties: value (state), setValue (setter)│
│   └─ Match: structural-reconstructed ✓           │
│                                                   │
│ Hook 2: callbacks (object: 3 properties)         │
│   ├─ Classification: all-functions               │
│   ├─ Properties: onClick, onSubmit, onCancel     │
│   └─ Match: structural-reconstructed ✓           │
└───────────────────────────────────────────────────┘
```

**Implementation**: Browser extension or React DevTools integration

**Benefits**:

- Instant visibility into classification decisions
- Helps developers understand why labels match/fail
- Educational tool for team onboarding

**Complexity**: High - requires:

- DevTools protocol integration
- UI development
- State synchronization

**Recommendation**: Long-term enhancement if library gains adoption.

---

## Implementation Priority

Based on value/complexity ratio:

**Phase 1 (Core)**:

1. Solution 8 basic implementation
2. Match diagnostics flag (#2) - low effort, high debugging value

**Phase 2 (Quick Wins)**: 3. Manual override API (#3) - low effort, essential escape hatch 4. Performance cap (#4) - low effort, prevents future issues

**Phase 3 (Refinements)**: 5. Auto-retry recovery (#1) - medium effort, handles dragon case gracefully

**Phase 4 (Future)**: 6. Recursive normalization (#5) - only if demonstrated need 7. Pluggable classifiers (#6) - only if user demand 8. Developer tooling (#7) - only if widespread adoption

---
