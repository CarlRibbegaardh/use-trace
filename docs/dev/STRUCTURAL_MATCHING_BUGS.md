# Structural Matching Bugs

## Glossary

### Core Concepts

**Component GUID (Globally Unique Identifier)**

- Unique identifier assigned to each component instance by the auto-tracer library
- Generation: Created by `useAutoTracer()` hook using counter + timestamp
- Format: `"render-track-{counter}-{timestamp}"` (e.g., `"render-track-42-1699876543210"`)
- Storage: Stored in a `useRef` within the component (persists across re-renders)
- **Primary Purpose**: Selects the correct fiber node in the React tree
- **Secondary Purpose**: Keys the label registry (`Map<GUID, LabelEntry[]>`)
- Lifetime: Persists across re-renders of the same component instance (ref stability)
- Discovery: Found by walking the fiber's `memoizedState` hook chain via DevTools access
- **Scope boundary**: Once the fiber is identified by GUID, all subsequent matching happens within that fiber's hooks

**Hook Index**

- Zero-based position of a hook in the component's hook call order
- Example: First `useState` call = index 0, second = index 1
- Immutable: Hook Rules ensure indices don't change between renders
- **Purpose**: Positional identifier for hooks **within the fiber identified by GUID**
- **Critical**: Index is relative to the component, not global

**Hook Value**

- The current state/data returned by a hook
- Examples:
  - `useState`: The state value itself (e.g., `5`, `"hello"`, `[]`)
  - `useCustomHook`: Usually an object like `{ value: X, setValue: fn }`
- Mutable: Changes on every render for stateful hooks

### Label System

**Hook Label**

- Human-readable name for a hook (e.g., `"count"`, `"emailForm"`, `"todos"`)
- Source: Variable name from source code, injected at build time
- Purpose: Makes tracing output readable instead of showing `"unknown"`

**Label Entry**

- A stored record mapping a hook to its label **within a specific component (GUID)**
- Structure: `{ label: string, index: number, value: unknown, propertyMetadata?: {...} }`
- Storage: Kept in a Map keyed by component GUID
- **Scope**: Each GUID has its own array of label entries

**Label Registry**

- Global Map storing all label entries: `Map<GUID, LabelEntry[]>`
- Structure: Each GUID maps to an array of labels for that component's hooks
- Lifetime: Persists across renders to enable label resolution
- Operations: `addLabelForGuid()`, `getLabelsForGuid()`, `resolveHookLabel()`
- **Key insight**: GUID isolates one component's labels from another's

### Processing Phases

**Registration Phase**

- When: First time a component renders with labeled hooks
- What: Calls `addLabelForGuid()` to store label + initial value
- Input: GUID (selects component), index (selects hook), label + value
- Side effect: Values are normalized before storage
- Trigger: Build-time injected code calls `logger.labelState()`
- **Scope**: Only affects the label registry for that specific GUID

**Resolution Phase**

- When: On subsequent renders, when we need to determine a hook's label
- What: Calls `resolveHookLabel()` to find matching label for current value
- **Prerequisites**:
  1. GUID already identified the correct fiber
  2. Fiber's hooks have been extracted
  3. Now matching hook values to stored labels
- Input: GUID (which component), index (which hook position), current value, all fiber hooks
- Output: Resolved label name or `"unknown"`
- **Critical**: All matching happens within the hooks of one fiber (one component instance)

**Structural Comparison Normalization**

- Process of converting values to a canonical form for **structural equivalence checking**
- Key transformation: Functions → literal string `"(fn)"`
- Purpose: Enable structural matching when function instances change between renders
- Effect: Different function instances become equivalent
- Example: `{value: "x", fn: f1}` and `{value: "y", fn: f2}` both normalize to `{value: X, fn: "(fn)"}`
- Timing: Happens at both registration AND resolution
- Function: `normalizeValue(value)`
- **Trade-off**: Loses information about which specific function instance

**Value Equality Normalization**

- Process of converting values to strings that preserve **function instance distinctness**
- Key transformation: Functions → `"(fn:N)"` where N is unique per function instance
- Purpose: Track and display when function instances change
- Effect: Different function instances get different IDs
- Example: `{value: "x", fn: f1}` serializes to `{"value":"x","fn":"(fn:1)"}`
- Timing: Happens when displaying/logging values
- Function: `stringify(value)` with `getFunctionId(fn)` for functions
- **Benefit**: Preserves function instance information in output

**The Core Tension**

- **Structural comparison**: Functions must be `"(fn)"` to match across renders (for label resolution)
- **Value equality**: Functions need `"(fn:N)"` to show instance changes (for debugging output)
- **The bug**: Stored values use structural comparison normalization, losing function instance info
- **The fix needed**: Store both forms, or preserve original values for later value equality normalization

### Matching Strategies

**Value-Based Matching (Scenario 1)**

- When: Current hook value is unique within the component
- How: Direct comparison of normalized values
- Example: Only one hook has value `false` → match by that value

**Ordinal Matching (Scenario 2)**

- When: Multiple hooks have identical values (after normalization)
- How: Match by position in the sorted list of same-valued hooks
- Example: Three hooks all return `[]` → use index order to disambiguate
- Requirement: All occurrences must be labeled

**Partial Ordinal (Scenario 3)**

- When: Some (not all) hooks with same value are labeled
- How: Return union of possible labels based on positional constraints
- Example: First and third of three `[]` values labeled → middle could be either

**Structural Matching (Solution 8)**

- When: Object structures match but values changed
- How: Compare property keys (name + order) of normalized objects
- Example: `{ value: "old", fn: f1 }` matches `{ value: "new", fn: f2 }`
- Fast-path: Direct key comparison if both values are objects
- Slow-path: Reconstruct from property metadata if structure evolved

### Data Structures

**Fiber Anchor**

- A hook's data point in React's internal fiber tree
- Structure: `{ index: number, value: unknown }`
- Source: Extracted from React DevTools hook during render commit
- Scope: Represents current render's hook state

**All Fiber Anchors**

- Array of all stateful hooks in a component's current render
- Includes: Both labeled and unlabeled hooks
- Purpose: Provides full context for ordinal disambiguation
- Example: `[{ index: 0, value: 5 }, { index: 1, value: obj }, { index: 2, value: true }]`

**Value Group**

- Subset of fiber anchors that share the same normalized value
- Calculated: Filter all anchors by matching `toComparableString()`
- Purpose: Determine if value is unique or needs ordinal disambiguation

**Property Metadata**

- Structural information stored for object-valued hooks
- Contains: Property keys, function indicators, nesting info
- Storage: Optional field in LabelEntry
- Purpose: Enable structural matching when objects evolve

### Comparison Utilities

**Comparable String**

- Stringified representation of a **structurally comparison normalized** value
- Format: JSON string like `'{"value":"test","setValue":"(fn)"}'`
- Purpose: Enables equality comparison of complex objects for matching
- Function: `toComparableString(v) = stringify(normalizeValue(v))`
- **Note**: Uses structural comparison normalization `"(fn)"`, not value equality normalization `"(fn:N)"`

**Stored Value**

- The **structurally comparison normalized** value saved in a LabelEntry during registration
- Warning: Not the original value! Functions already converted to `"(fn)"`
- Impact: Cannot apply value equality normalization for display (bug source)
- Mutation: May be updated by structural matching to track evolution

---

## Architecture: Two-Stage Process

### Stage 1: Fiber Selection (Via GUID)

The GUID is used **only** to locate the correct fiber node in the React tree:

1. Component calls `useAutoTracer()` → gets unique GUID stored in ref
2. Auto-tracer walks the fiber tree via React DevTools hook
3. For each fiber, calls `getTrackingGUID(fiber)` to check if it contains our GUID
4. When GUID match found → **this fiber is the target component**

**Result**: We now have the correct fiber node (one component instance)

### Stage 2: Hook Matching (Within That Fiber)

All the bugs in this document occur in **Stage 2** - after the fiber is selected:

1. Extract all hooks from the fiber's `memoizedState` chain
2. For each hook at position `index`:
   - Get the current value from the fiber
   - Look up stored labels in registry: `registry.get(GUID)[index]`
   - Try to match current value to stored label value
   - **This is where structural matching happens**
   - **This is where the bugs occur**

**Critical Insight**:

- GUID matching is **simple and reliable** (string equality)
- Hook matching is **complex and buggy** (value-based + structural + ordinal)
- These bugs are about **matching structures within a single component's hooks**
- Multiple instances of the same component (different GUIDs) don't interfere with each other

---

## Overview

Created comprehensive test suite `hookLabels.structuralMatching.test.ts` to validate the structural matching behavior that `normalizeValue()` was designed to support. The tests reveal **4 real bugs** in the current implementation.

## Test Results

- ✅ **12 tests passing** - Basic structural matching works for simple cases
- ❌ **4 tests failing** - Critical bugs in edge cases

## Bugs Identified

### Bug 1: Structure Changes Not Detected

**Reproducing Test:**
- File: `tests/lib/functions/hookLabels.structuralMatching.test.ts`
- Test: `"should NOT match when structure changes (different keys)"`

**Test:** `should NOT match when structure changes (different keys)`

**Expected:** When object structure changes (different number of keys), should return `"unknown"`

**Actual:** Returns the old label `"simpleState"` even though structure changed

**Real-World Example:**

```typescript
// ============================================================================
// SWIMLANE 1: USER CODE (Component Definition)
// ============================================================================

// Version 1: Simple form validation hook
function useFormValidation(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue
  };
}

function LoginForm() {
  const emailField = useFormValidation(""); // Hook at index 0

  return <input value={emailField.value} onChange={e => emailField.setValue(e.target.value)} />;
}

// ============================================================================
// SWIMLANE 2: BUILD-TIME INJECTION (Babel Plugin)
// ============================================================================

// The Babel plugin injects code to register the hook label:
function LoginForm() {
  const emailField = useFormValidation("");

  // INJECTED: Register label on first render
  if (typeof __autoTracerRegisterLabel !== 'undefined') {
    __autoTracerRegisterLabel('LoginForm-guid-abc123', {
      index: 0,
      label: 'emailField',
      value: emailField  // { value: "", setValue: [Function] }
    });
  }

  return <input value={emailField.value} onChange={e => emailField.setValue(e.target.value)} />;
}

// ============================================================================
// SWIMLANE 3: REGISTRATION PHASE (First Render)
// ============================================================================

// Auto-tracer receives the registration call
addLabelForGuid('LoginForm-guid-abc123', {
  index: 0,
  label: 'emailField',
  value: { value: "", setValue: [Function#1] }
});

// Internal processing:
// 1. Apply structural comparison normalization (for matching):
//    { value: "", setValue: [Function#1] } → { value: "", setValue: "(fn)" }
//
// 2. Store in registry:
//    Label Entry = {
//      label: "emailField",
//      index: 0,
//      value: { value: "", setValue: "(fn)" },  // ← STRUCTURALLY NORMALIZED, NOT ORIGINAL
//      propertyMetadata: { /* structure info */ }
//    }
//
// Problem: We lost the original function reference!
// - Can't apply value equality normalization "(fn:1)" for display
// - Stored value has literal string "(fn)", not function

// ============================================================================
// SWIMLANE 4: USER CODE EVOLUTION (Developer Adds Feature)
// ============================================================================

// Version 2: Developer adds validation error support
function useFormValidation(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!value.includes('@')) {
      setError('Invalid email');
    }
  };

  return {
    value,
    setValue,
    // NEW PROPERTIES:
    error,      // ← Added
    validate    // ← Added
  };
}

// Same component, now returns 4 properties instead of 2!
function LoginForm() {
  const emailField = useFormValidation(""); // Still at index 0, same GUID

  return (
    <div>
      <input value={emailField.value} onChange={e => emailField.setValue(e.target.value)} />
      <button onClick={emailField.validate}>Validate</button>
      {emailField.error && <span>{emailField.error}</span>}
    </div>
  );
}

// ============================================================================
// SWIMLANE 5: RESOLUTION PHASE (Subsequent Render After Code Change)
// ============================================================================

// React re-renders LoginForm after user types "test"
// Fiber now contains:
const allFiberAnchors = [
  {
    index: 0,
    value: {
      value: "test",           // ← User typed this
      setValue: [Function#2],  // ← New function instance (not memoized)
      error: null,             // ← NEW PROPERTY
      validate: [Function#3]   // ← NEW PROPERTY
    }
  }
];

// Auto-tracer calls resolveHookLabel to determine the label for index 0:
const resolved = resolveHookLabel(
  'LoginForm-guid-abc123',  // Same GUID
  0,                         // Same index
  allFiberAnchors[0].value,  // New value with 4 properties
  allFiberAnchors
);

// ============================================================================
// SWIMLANE 6: RESOLUTION ALGORITHM (What Should Happen vs What Actually Happens)
// ============================================================================

// Step 1: Apply structural comparison normalization to current value
//   Current: { value: "test", setValue: fn, error: null, validate: fn }
//   Structurally Normalized: { value: "test", setValue: "(fn)", error: null, validate: "(fn)" }

// Step 2: Build comparable string (for matching)
//   stringify(normalized) = '{"value":"test","setValue":"(fn)","error":null,"validate":"(fn)"}'

// Step 3: Find value group (all anchors with same structurally normalized value)
//   valueGroup = [{ index: 0, value: {...} }]  // Only one item

// Step 4: Unique value branch (line 166-183)
//   Since valueGroup.length === 1, try direct value matching first
//
//   Search stored labels for matching comparable value:
//   - Stored: '{"value":"","setValue":"(fn)"}'
//   - Current: '{"value":"test","setValue":"(fn)","error":null,"validate":"(fn)"}'
//   - Match? NO ❌ (different keys!)
//
//   No direct match found → fall through to structural matching

// Step 5: tryStructuralMatching() called (line 174-181)
//   This is where the bug occurs!

// Step 6: Fast-path structural comparison (lines 313-327)
//   Stored keys: Object.keys({ value: "", setValue: "(fn)" })
//              = ["value", "setValue"]  (2 keys)
//
//   Current keys: Object.keys({ value: "test", setValue: "(fn)", error: null, validate: "(fn)" })
//               = ["value", "setValue", "error", "validate"]  (4 keys)
//
//   Check: storedKeys.length === currentKeys.length
//   Result: 2 === 4 → FALSE ✅
//
//   EXPECTED: Skip this label, continue to next label, eventually return "unknown"
//   ACTUAL: Still returns "emailField" ❌

// ============================================================================
// SWIMLANE 7: THE BUG MANIFESTATION
// ============================================================================

// Despite the structure changing from 2 to 4 properties:
resolved === "emailField"  // ❌ WRONG!

// Should be:
resolved === "unknown"  // ✅ CORRECT

// Impact on developer:
console.log(`Hook at index 0 is: ${resolved}`);
// Prints: "Hook at index 0 is: emailField"
// Developer sees old label for evolved structure!

// Trace output shows:
// LoginForm.emailField: { value: "test", setValue: "(fn)", error: null, validate: "(fn)" }
//
// Problem 1: Literal "(fn)" strings instead of "(fn:1)", "(fn:2)" from value equality normalization
// Problem 2: This is MISLEADING because the original "emailField" label was registered
//            for a 2-property object, but now it's being used for a 4-property object!
```

**Why This Happens:**

The bug likely occurs because:

1. **Value mutation**: Previous structural matches may have updated `labelEntry.value` (line 327), so the stored value now has 4 keys instead of 2
2. **Property metadata fallback**: The reconstruction logic (lines 333-345) might be matching based on partial key overlap
3. **Missing guard**: The fast-path returns early on match, but doesn't guard against continuing on mismatch

**Why This Is Critical:**

1. **Type safety violation**: Label suggests 2-property interface, but actual value has 4 properties
2. **Stale documentation**: Trace output associates old label with new structure
3. **Developer confusion**: "emailField" name doesn't reflect the evolved capabilities
4. **Silent failure**: No warning that structure changed, just wrong label
5. **Display bug compounded**: Both wrong label AND literal `"(fn)"` instead of value equality `"(fn:1)"`

**The Two-Part Problem:**

1. **Structural matching bug** (this document): Wrong label returned when structure changes
2. **Display bug** (separate issue): Even correct labels show `"(fn)"` instead of `"(fn:N)"`

Both stem from storing structurally comparison normalized values instead of preserving originals.

**When Does This Bug Occur in Practice?**

This bug manifests in several real-world development scenarios:

**React Lifecycle Context: Re-render (Not Mount)**

The bug occurs during **re-renders** when labels are stale, NOT during initial mount:

- ✅ **Mount (First Render)**: Labels are fresh and correct - NO BUG
  - Component mounts, GUID created
  - `labelState()` called with current structure
  - Labels stored correctly

- ✅ **Normal Re-render**: Structure unchanged - NO BUG
  - Component re-renders (state/prop change)
  - `labelState()` clears and re-registers labels (index 0)
  - Structure matches, labels correct

- ❌ **Re-render with Stale Labels**: Structure changed but labels not updated - BUG MANIFESTS
  - Labels registered with old structure
  - Resolution happens with new structure
  - Label registry has stale data
  - `resolveHookLabel()` incorrectly matches new structure to old labels

**Critical Distinction: Which Components Are Affected?**

This bug **ONLY affects components within your solution** (not external libraries):

1. **Components in Your Solution (WITH label calls)** - ❌ AFFECTED BY BUG
   - Built with your Babel plugin
   - Has `logger.labelState()` calls injected
   - Registers labels in the label registry
   - Subject to stale label matching issues
   - **Examples**: Your `LoginForm`, `TodoList`, custom components
   - **This is where Bug 1 manifests**

2. **External Library Components (NO label calls)** - ✅ NOT AFFECTED
   - From node_modules (MUI, React Router, etc.)
   - NO Babel plugin transformation
   - NO `logger.labelState()` calls
   - NO labels registered
   - Always shows as `"unknown"` in traces
   - **Examples**: `<Button>` from MUI, `<TextField>`, etc.
   - **Cannot experience this bug** (no labels to become stale)

**Why This Matters:**

The bug is specifically about **your application code during development**:
- You edit YOUR custom hooks
- YOUR components have label calls
- Labels in YOUR code become stale during HMR
- External libraries are unaffected (no labels to match)

**Key Question: Why Would Labels Be Stale?**

Normal HMR *should* clear and re-register labels, but labels can become stale in these scenarios:

1. **Hot Module Replacement (HMR) / Hot Reload - MOST COMMON**
   - Developer adds new properties to custom hook
   - Vite/Webpack HMR updates the module
   - **Expected**: Component re-renders → `labelState(0, ...)` clears old labels → registers new structure
   - **Bug scenario A**: HMR race condition where resolution happens before label re-registration
   - **Bug scenario B**: Component updates but render doesn't execute (React Fast Refresh edge case)
   - **Bug scenario C**: Label registry module not hot-reloaded, stays stale
   - Bug: System tries to match new structure to old labels during brief window

2. **Code Split / Lazy Loading with Component Updates**
   - Component version 1 loaded and labeled initially
   - User navigates away, component unmounts
   - Developer deploys version 2 (hook structure changed)
   - User navigates back, new version lazy loads
   - If label registry persists (browser extension, long-lived session), old labels remain
   - Component mounts with new structure but doesn't clear old labels (different GUID expected)
   - Bug: New structure matched to old labels if GUID happens to collide or persist

3. **Incremental Feature Development (Same Session) - Resolution Before Re-registration**
   - Component renders with basic hook → labels registered
   - Developer changes code to add properties
   - Build system updates, browser reloads module
   - **Timing issue**: Auto-tracer processes previous render's fiber data AFTER code updated
   - Resolution happens with new fiber structure but old labels still in registry
   - Bug: Resolution phase reads stale labels before next render clears them

4. **A/B Testing or Feature Flags**
   - User sees version A (basic hook structure)
   - Labels registered for version A
   - Feature flag flips to version B (enhanced structure)
   - Component re-renders with new structure
   - Bug: Version B matched to Version A labels

5. **SSR/Hydration Mismatch**
   - Server renders with hook version A
   - Client hydrates with hook version B (deployment race condition)
   - Label mismatch causes incorrect structural matching

**Most Likely Scenario: Resolution Timing Race During HMR**

The primary issue is a **timing/ordering problem** during hot reload:

```typescript
// Normal HMR flow (works correctly):
// 1. HMR updates component code
// 2. Component re-renders
// 3. labelState(0, ...) CLEARS old labels (line 99 of renderRegistry.ts)
// 4. labelState(0, ...) registers NEW labels with new structure
// 5. Resolution happens with fresh labels
// ✅ NO BUG

// Race condition (bug manifests):
// 1. HMR updates component code
// 2. Auto-tracer processes PREVIOUS render's fiber (async)
// 3. Resolution happens with OLD labels (not cleared yet)
// 4. Component re-renders
// 5. labelState(0, ...) clears and updates labels (too late)
// ❌ BUG: Step 3 matched new structure to old labels
```

**Why Label Registry Persists:**

The label registry (`guidToLabelsMap`) is a module-level `Map` that survives HMR:
- Declared at module scope in `hookLabels.ts`
- NOT reset by HMR (unless module itself reloads)
- Persists across component re-renders
- Only cleared by explicit `clearLabelsForGuid()` call

**The Critical Detail: When Does Resolution Happen?**

Resolution (`resolveHookLabel`) is called during **fiber tree processing**, which happens:
- After component render completes
- During React DevTools hook `onCommitFiberRoot` callback
- Potentially async relative to component re-render

If resolution processes a fiber BEFORE the component's re-render clears labels:
→ Bug manifests (new structure matched to old labels)

**Fix Needed:**

Either:
- Clear labels on HMR boundary
- Detect structure changes and return "unknown"
- Store original values for comparison

**Root Cause:** The structural matching logic in `tryStructuralMatching()` (lines 255-345 of `hookLabels.ts`) has a code path that incorrectly matches despite key count mismatches. The fast-path check at lines 319-327 SHOULD catch `storedKeys.length !== currentKeys.length`, but either:

1. The stored value has been mutated by previous structural matches (line 327: `labelEntry.value = normalizedCurrent`), OR
2. There's a fallback path that bypasses the key count check, OR
3. The property metadata reconstruction logic (lines 333-345) is matching incorrectly

---

### Bug 2: Key Order Changes Not Detected

**Reproducing Test:**
- File: `tests/lib/functions/hookLabels.structuralMatching.test.ts`
- Test: `"should NOT match when key order changes"`

**Test:** `should NOT match when key order changes`

**Expected:** When property order changes, should return `"unknown"`

**Actual:** Returns the old label `"orderedState"` even though key order changed

**Scenario:**

```typescript
// First render: [value, setValue]
{ value: "test", setValue: () => {} }

// Second render: [setValue, value] (DIFFERENT ORDER)
{ setValue: () => {}, value: "test" }

// Expected: "unknown" (key order changed)
// Actual: "orderedState" (incorrectly matched)
```

**Root Cause:** The key order check at lines 323-325 uses `storedKeys.every((k, i) => k === currentKeys[i])`, which should catch order changes. Likely related to normalization affecting key order.

---

### Bug 3: Ordinal Disambiguation Fails (2 Hooks)

**Reproducing Test:**
- File: `tests/lib/functions/hookLabels.structuralMatching.test.ts`
- Test: `"should distinguish multiple form hooks by ordinal position"`

**Test:** `should distinguish multiple form hooks by ordinal position`

**Expected:** Two hooks with identical structure should be distinguished by ordinal position

**Actual:** Both resolve to the first label `"emailForm"`

**Scenario:**

```typescript
// Registered labels:
addLabelForGuid(guid, { index: 0, label: "emailForm", value: {...} });
addLabelForGuid(guid, { index: 1, label: "passwordForm", value: {...} });

// Both have identical normalized structure: { value: X, setValue: "(fn)", error: null }

// Resolution:
resolveHookLabel(guid, 0, emailForm2, allFiberAnchors);   // ✅ Returns "emailForm"
resolveHookLabel(guid, 1, passwordForm2, allFiberAnchors); // ❌ Returns "emailForm" (should be "passwordForm")
```

**Root Cause:** The ordinal matching logic at lines 189-202 appears broken. When all values are normalized to the same structure, the ordinal disambiguation should kick in (Scenario 2: Duplicate Values, All Labeled), but it's returning the wrong label.

---

### Bug 4: Ordinal Disambiguation Fails (3 Hooks)

**Reproducing Test:**
- File: `tests/lib/functions/hookLabels.structuralMatching.test.ts`
- Test: `"should handle three hooks with same structure using ordinal"`

**Test:** `should handle three hooks with same structure using ordinal`

**Expected:** Three hooks with identical structure should be distinguished by ordinal position

**Actual:** All resolve to the first label `"state1"`

**Scenario:**

```typescript
// Registered labels:
addLabelForGuid(guid, {
  index: 0,
  label: "state1",
  value: { value: "a", setValue: fn },
});
addLabelForGuid(guid, {
  index: 1,
  label: "state2",
  value: { value: "b", setValue: fn },
});
addLabelForGuid(guid, {
  index: 2,
  label: "state3",
  value: { value: "c", setValue: fn },
});

// All have identical normalized structure: { value: X, setValue: "(fn)" }

// Resolution:
resolveHookLabel(guid, 0, newState1, allFiberAnchors); // ✅ Returns "state1"
resolveHookLabel(guid, 1, newState2, allFiberAnchors); // ❌ Returns "state1" (should be "state2")
resolveHookLabel(guid, 2, newState3, allFiberAnchors); // ❌ Returns "state1" (should be "state3")
```

**Root Cause:** Same as Bug 3, but demonstrates the issue scales with number of hooks.

---

## Analysis

### The Core Problem

The structural matching design has an **architectural flaw**:

1. Values are **normalized before storage** (line 53: `value: normalizeValue(entry.value)`)
2. Functions become literal `"(fn)"` strings
3. When resolution compares normalized values, **all instances look identical**
4. The ordinal disambiguation logic fails because it can't distinguish between the stored normalized values

### Why Bugs 1 & 2 Occur

The structural matching fast-path (lines 313-327) compares the **stored normalized value** against the **current normalized value**. However:

- The stored value was normalized at registration time
- The current value is normalized at resolution time
- If normalization is lossy or inconsistent, structures that should differ may appear identical

### Why Bugs 3 & 4 Occur

The ordinal matching logic (Scenario 2, lines 189-202) is supposed to handle duplicate values:

```typescript
// Scenario 2: All occurrences labeled → ordinal match
if (labelsWithValue.length === valueGroup.length) {
  const sortedAnchors = valueGroup.sort((a, b) => a.index - b.index);
  const sortedLabels = labelsWithValue.sort((a, b) => a.index - b.index);
  const ordinal = sortedAnchors.findIndex((a) => a.index === anchorIndex);
  return sortedLabels[ordinal]?.label ?? "unknown";
}
```

This logic should work, but it's failing. Likely causes:

1. The `valueGroup` is incorrectly calculated (line 160-162)
2. The `labelsWithValue` is incorrectly filtered (line 186-188)
3. The ordinal calculation is off-by-one or using wrong indices

## Impact on Display Bug Fix

These structural matching bugs **must be fixed first** before addressing the display bug (`(fn)` vs `(fn:N)`). Otherwise:

1. Fixing the display bug might break structural matching
2. We can't validate that the display fix doesn't regress structural matching
3. The test suite won't provide reliable regression protection

## Recommended Approach

### Phase 1: Fix Structural Matching (FIRST)

1. ✅ **DONE:** Create comprehensive test suite (hookLabels.structuralMatching.test.ts)
2. **TODO:** Debug and fix Bug 3 & 4 (ordinal disambiguation)
3. **TODO:** Debug and fix Bug 1 & 2 (structure/order detection)
4. **TODO:** Validate all 16 tests pass

### Phase 2: Fix Display Bug (SECOND)

1. Store both normalized and original values
2. Use normalized for comparison
3. Use original for display
4. Validate both test suites pass:
   - ✅ hookLabels.structuralMatching.test.ts (16 tests)
   - ✅ hookLabels.normalizeValue.bug.test.ts (3 tests)

## Next Steps

1. **Investigate ordinal logic:** Debug `resolveHookLabel` lines 189-202 with test data
2. **Investigate structural comparison:** Debug fast-path lines 313-327 with test data
3. **Fix bugs incrementally:** One test at a time, ensuring no regressions
4. **Then tackle display bug:** With confidence that structural matching is solid

## Test Suite Location

`packages/auto-tracer-react18/tests/lib/functions/hookLabels.structuralMatching.test.ts`

Run with:

```bash
pnpm --filter @auto-tracer/react18 test hookLabels.structuralMatching
```
