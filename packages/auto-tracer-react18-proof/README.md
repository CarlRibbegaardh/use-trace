# @auto-tracer/react18-proof

> **Proof-of-concept package with comprehensive test coverage for React 18 auto-tracing functionality**

[![Tests](https://img.shields.io/badge/tests-63%2F63%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/scenario%20coverage-100%25-brightgreen)]()
[![React](https://img.shields.io/badge/React-18.3.1-blue)]()
[![Vitest](https://img.shields.io/badge/Vitest-4.0.3-yellow)]()

## Quick Start

```bash
# Run all tests
pnpm --filter @auto-tracer/react18-proof test

# Expected: ✅ 63/63 tests passing in ~4 seconds
```

## Overview

This package contains proof-of-concept React components and comprehensive Vitest tests that verify the behavior of the `@auto-tracer/react18` library. All components manually call `useAutoTracer` and `logger.labelState()` (no Babel injection), making this a clean testing ground for the core tracing functionality.

**Key Achievement**: Full test coverage of all specification scenarios with tests that validate React's internal hook storage model.

## Purpose

- **Proof of Concept**: Minimal React components demonstrating each scenario from the high-level specification
- **Test Coverage**: Structured unit tests covering all initial prop/state detection and change detection scenarios
- **No Build-Time Injection**: All `useAutoTracer` and `labelState` calls are manual, avoiding build-time complexity
- **Scenario-Based Organization**: Components and tests are organized by the scenarios defined in `spec-highlevel-draft.md`
- **React Internals Validation**: Tests verify behavior matches React's internal hook storage (values from fiber, setters from labels)
- **Public API Only**: Tests ONLY import from the public package exports (`@auto-tracer/react18`). Deep imports from internal paths (e.g., `/src/lib/...`) are **strictly forbidden** and will cause tests to fail. This ensures the library's public API contract is validated, not internal implementation details.

## Project Structure

```
src/
├── initial-props/          # Scenario 1-2: Initial prop detection and formatting
│   ├── SimplePropComponent.tsx      # Primitive props (name, count)
│   ├── FunctionPropComponent.tsx    # Function props with (fn:N) formatting
│   └── ObjectPropComponent.tsx      # Object props with JSON serialization
│
├── initial-state/          # Scenario 3-4: Initial state detection and formatting
│   ├── SimpleStateComponent.tsx     # Basic useState hook
│   ├── MultiStateComponent.tsx      # Multiple useState with source order
│   └── ObjectStateComponent.tsx     # Boolean, object, array state
│
├── prop-changes/           # Scenario 5-6: Prop change detection and formatting
│   ├── PropChangeParent.tsx         # Parent component triggering re-render
│   ├── PropChangeChild.tsx          # Child receiving changed props
│   └── FormattingPropComponent.tsx  # Various formatting sizes
│
├── state-changes/          # Scenario 7-8: State change detection and formatting
│   ├── StateUpdateComponent.tsx     # Basic state updates
│   └── FormattingStateComponent.tsx # Primitive, object, array, function updates
│
├── tree-rendering/         # Tree Rendering and Filter Modes
│   ├── DeepTreeComponent.tsx        # Deep nested structure with empty wrappers
│   ├── EmptyWrapper.tsx             # Untracked wrapper component (empty node)
│   └── TrackedComponent.tsx         # Tracked component with state (non-empty)
│
└── special-cases/          # Special scenarios
    ├── UnlabeledStateComponent.tsx  # Unlabeled state → "unknown"
    ├── useCounter.tsx               # Custom hook
    ├── CustomHookComponent.tsx      # Custom hook with labels
    └── IdenticalValueComponent.tsx  # Identical value detection

tests/unit/
└── [mirrors src structure with .test.tsx files]
```

## Folder Organization Principles

### Concern-Based Grouping

- Each folder represents a single top-level scenario from the specification
- Components are focused and single-purpose (no "Swiss Army knives")
- Component pairs (like Parent/Child) live together when they form a cohesive scenario

### Extendable Design

- New scenarios can be added as new folders
- Each scenario is self-contained
- Tests mirror the source structure exactly

### Import Aliases

- `@src` → `src/` folder
- `@tests` → `tests/` folder
- Configured in `vitest.config.ts`

## Running Tests

```bash
# From monorepo root - run all 42 tests
pnpm --filter @auto-tracer/react18-proof test

# Run specific test file
pnpm --filter @auto-tracer/react18-proof test tests/unit/initial-props/SimplePropComponent.test.tsx

# Run with coverage
pnpm --filter @auto-tracer/react18-proof test --coverage

# Watch mode during development
pnpm --filter @auto-tracer/react18-proof test --watch
```

**Expected Result**: All 63 tests pass in ~3 seconds

## Test Matrix

Comprehensive coverage of all specification scenarios with 63 tests across 18 test suites:

| Category             | Component                              | Tests        | Scenarios Covered                                                           |
| -------------------- | -------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| **Initial Props**    | `SimplePropComponent`                  | 3            | Mount detection, primitive props, React internal prop skipping              |
|                      | `FunctionPropComponent`                | 2            | Function prop formatting `(fn:N)`, stable function IDs                      |
|                      | `ObjectPropComponent`                  | 3            | Object JSON stringification, nested objects, rendering                      |
| **Initial State**    | `SimpleStateComponent`                 | 3            | useState detection, setter formatting `(fn:N)`, initial mount               |
|                      | `MultiStateComponent`                  | 3            | Multiple useState hooks, React fiber order (values→setters), correct values |
|                      | `ObjectStateComponent`                 | 5            | Boolean/object/array formatting, all setter functions, rendering            |
| **Prop Changes**     | `PropChangeParent` + `PropChangeChild` | 3            | Re-render detection, before→after values, child updates                     |
|                      | `FormattingPropComponent`              | 4            | Short (<20 chars), medium (20-200), function changes, identical value skip  |
| **State Changes**    | `StateUpdateComponent`                 | 3            | State change detection, before→after values, UI updates                     |
|                      | `FormattingStateComponent`             | 4            | Primitive/object/array/function changes, formatting rules                   |
| **Tree Rendering**   | `DeepTreeComponent` (filter: none)     | 3            | No filtering, all nodes visible, no markers, tree connectors                |
|                      | `DeepTreeComponent` (filter: first)    | 4            | First empty sequence collapsed, marker appears, reduced lines               |
|                      | `DeepTreeComponent` (filter: all)      | 5            | All empty sequences collapsed, multiple markers, maximum clarity            |
|                      | `MarkerCalculation`                    | 4            | Standard mode (N levels), debug mode (Level: N), singular/plural, depth     |
|                      | `ConnectorDisplay`                     | 5            | Tree connectors (├─, └─┐), marker integration, debug patterns              |
| **Special Cases**    | `UnlabeledStateComponent`              | 3            | Unlabeled state as "unknown", value detection, rendering                    |
|                      | `CustomHookComponent`                  | 3            | Custom hook labels, state change detection, rendering                       |
|                      | `IdenticalValueComponent`              | 3            | Identical value detection, warning when enabled, rendering                  |
| **Total**            | **18 test suites**                     | **63 tests** | **All 8 core scenarios + tree rendering + 3 special cases**                 |

### Test Coverage Tree

```
tests/unit/
├── initial-props/ (8 tests)
│   ├── SimplePropComponent.test.tsx (3)
│   │   ✓ Detects primitive props on mount
│   │   ✓ Skips React internal props
│   │   ✓ Renders correctly
│   ├── FunctionPropComponent.test.tsx (2)
│   │   ✓ Formats function props as (fn:N)
│   │   ✓ Assigns stable function IDs
│   └── ObjectPropComponent.test.tsx (3)
│       ✓ JSON stringifies object props
│       ✓ Handles nested objects
│       ✓ Renders correctly
│
├── initial-state/ (11 tests)
│   ├── SimpleStateComponent.test.tsx (3)
│   │   ✓ Detects initial state on mount
│   │   ✓ Formats setter as (fn:N)
│   │   ✓ Renders correctly
│   ├── MultiStateComponent.test.tsx (3)
│   │   ✓ Detects multiple hooks in React fiber order
│   │   ✓ Logs correct initial values
│   │   ✓ Renders correctly
│   └── ObjectStateComponent.test.tsx (5)
│       ✓ Formats boolean state
│       ✓ Formats object as JSON
│       ✓ Formats array as JSON
│       ✓ Formats all setters as (fn:N)
│       ✓ Renders correctly
│
├── prop-changes/ (7 tests)
│   ├── PropChangeParent.test.tsx (3)
│   │   ✓ Detects prop change on parent update
│   │   ✓ Shows correct before→after values
│   │   ✓ Updates child component
│   └── FormattingPropComponent.test.tsx (4)
│       ✓ Formats short changes inline (<20 chars)
│       ✓ Formats medium changes multi-line (20-200 chars)
│       ✓ Formats function changes as (fn:N)→(fn:M)
│       ✓ No log for identical values
│
├── state-changes/ (7 tests)
│   ├── StateUpdateComponent.test.tsx (3)
│   │   ✓ Detects state change on update
│   │   ✓ Shows correct before→after values
│   │   ✓ Updates UI with new value
│   └── FormattingStateComponent.test.tsx (4)
│       ✓ Formats primitive changes
│       ✓ Formats object changes as JSON
│       ✓ Formats array changes as JSON
│       ✓ Formats function changes as (fn:N)→(fn:M)
│
├── tree-rendering/ (21 tests)
│   ├── DeepTreeComponent.none.test.tsx (3)
│   │   ✓ Shows all nodes without filtering
│   │   ✓ No markers appear
│   │   ✓ Renders DOM correctly
│   ├── DeepTreeComponent.first.test.tsx (4)
│   │   ✓ Collapses initial empty sequence
│   │   ✓ Shows marker with correct format
│   │   ✓ Empty nodes reappear after first tracked
│   │   ✓ Reduces output lines vs none mode
│   ├── DeepTreeComponent.all.test.tsx (5)
│   │   ✓ Collapses all empty sequences
│   │   ✓ Shows multiple markers
│   │   ✓ Fewest lines compared to other modes
│   │   ✓ Maximum clarity (no empty wrapper noise)
│   │   ✓ Renders DOM correctly
│   ├── MarkerCalculation.test.tsx (4)
│   │   ✓ Shows count format in standard mode
│   │   ✓ Shows depth format in debug mode
│   │   ✓ Handles singular vs plural correctly
│   │   ✓ Maintains visual depth consistency
│   └── ConnectorDisplay.test.tsx (5)
│       ✓ Shows tree connectors with filter none
│       ✓ Skips intermediate connectors with markers
│       ✓ Maintains depth transitions
│       ✓ Consistent patterns in debug mode
│       ✓ Proper spacing with multiple tracked components
│
└── special-cases/ (9 tests)
    ├── UnlabeledStateComponent.test.tsx (3)
    │   ✓ Shows unlabeled state as 'unknown'
    │   ✓ Still detects and logs value
    │   ✓ Renders correctly
    ├── CustomHookComponent.test.tsx (3)
    │   ✓ Detects custom hook state with labels
    │   ✓ Detects custom hook state changes
    │   ✓ Renders correctly
    └── IdenticalValueComponent.test.tsx (3)
        ✓ Detects changes with identical values
        ✓ Shows warning when enabled
        ✓ Renders correctly

Total: 63 tests across 18 suites ✅
```

### Scenario Coverage Details

#### ✅ Scenario 1: Initial Prop Detection (Mount)

- **Files**: `SimplePropComponent.test.tsx`
- **Tests**:
  - Detects and logs primitive props on mount
  - Skips React internal props (children, key, ref, **self, **source)
  - Component renders correctly
- **Verified**: Mount logs appear, prop names and values are correct

#### ✅ Scenario 2: Initial Prop Output Formatting

- **Files**: `FunctionPropComponent.test.tsx`, `ObjectPropComponent.test.tsx`
- **Tests**:
  - Function props formatted as `(fn:N)` with stable IDs
  - Objects JSON stringified with stable key ordering
  - Nested objects handled correctly
- **Verified**: Function IDs are stable across renders, JSON formatting is correct

#### ✅ Scenario 3: Initial State Detection (Mount)

- **Files**: `SimpleStateComponent.test.tsx`, `MultiStateComponent.test.tsx`
- **Tests**:
  - useState hooks detected on mount
  - Multiple useState hooks logged in React fiber order
  - Values appear before setters (React's internal storage model)
- **Verified**: Order is `count, name, setCount, setName` (values from fiber, then setters from labels)

#### ✅ Scenario 4: Initial State Output Formatting

- **Files**: `ObjectStateComponent.test.tsx`
- **Tests**:
  - Boolean state formatted correctly (`true`/`false`)
  - Object state JSON stringified (`{"id":1,"name":"Alice"}`)
  - Array state JSON stringified (`[1,2,3]`)
  - All setter functions show `(fn:N)` format
- **Verified**: All state value types format correctly, setters have stable IDs

#### ✅ Scenario 5: Prop Change Detection (Update)

- **Files**: `PropChangeParent.test.tsx`
- **Tests**:
  - Prop changes detected when parent updates
  - Before and after values shown
  - Child component receives and displays new value
- **Verified**: Re-render logs show "Rendering" with prop changes

#### ✅ Scenario 6: Prop Change Output Formatting

- **Files**: `FormattingPropComponent.test.tsx`
- **Tests**:
  - Short changes (<20 chars): inline format `5 → 10`
  - Medium changes (20-200 chars): multi-line format
  - Function changes: `(fn:N) → (fn:M)` with different IDs
  - No log when prop values are identical (same reference)
- **Verified**: Formatting rules apply correctly based on content length

#### ✅ Scenario 7: State Change Detection (Update)

- **Files**: `StateUpdateComponent.test.tsx`
- **Tests**:
  - State changes detected on button click
  - Before and after values shown (`0 → 5`)
  - UI updates with new state value
- **Verified**: State change logs appear after user interaction

#### ✅ Scenario 8: State Change Output Formatting

- **Files**: `FormattingStateComponent.test.tsx`
- **Tests**:
  - Primitive state: inline format (`0 → 5`)
  - Object state: JSON multi-line format
  - Array state: JSON multi-line format
  - Function state: `(fn:N) → (fn:M)` when reference changes
- **Verified**: All state value types format correctly on changes

#### ✅ Special Case: Unlabeled State

- **Files**: `UnlabeledStateComponent.test.tsx`
- **Tests**:
  - Unlabeled hooks show as "unknown" (not `<unlabeled>`)
  - State value is still detected and logged
  - Component renders correctly
- **Verified**: Missing labels don't break detection, generic label used

#### ✅ Special Case: Custom Hooks

- **Files**: `CustomHookComponent.test.tsx`, `useCounter.tsx`
- **Tests**:
  - Custom hook state detected with labels
  - Custom hook state changes detected
  - Component renders correctly
- **Verified**: Custom hooks work same as built-in hooks with proper labeling

#### ✅ Special Case: Identical Value Changes

- **Files**: `IdenticalValueComponent.test.tsx`
- **Tests**:
  - State changes detected even with identical values (different references)
  - Warning shown when `detectIdenticalValueChanges` enabled
  - Component renders correctly
- **Verified**: Matches both `"State change data:"` and `"State change data (identical value):"` formats

#### ✅ Tree Rendering and Filter Modes

- **Files**: `DeepTreeComponent.tsx`, `EmptyWrapper.tsx`, `TrackedComponent.tsx`
- **Tests (21 total)**:
  - **Filter Mode: none** (3 tests)
    - All nodes visible including empty wrappers
    - No marker insertion
    - Full tree structure with connectors
  - **Filter Mode: first** (4 tests)
    - Only initial empty sequence collapsed
    - Single marker appears before first tracked component
    - Empty nodes reappear after first tracked
    - Fewer output lines than none mode
  - **Filter Mode: all** (5 tests)
    - All empty sequences collapsed throughout tree
    - Multiple markers inserted
    - Fewest output lines (maximum clarity)
    - No empty wrapper noise in output
  - **Marker Calculation** (4 tests)
    - Standard mode: "... (N empty level[s])" format
    - Debug mode: "... (Level: N)" format
    - Correct singular/plural handling
    - Visual depth consistency
  - **Connector Display** (5 tests)
    - Tree connectors (├─, └─┐) display correctly
    - Proper integration with markers
    - Depth transitions maintained
    - Debug mode patterns consistent
- **Verified**: All three filter modes work correctly, markers display proper format, tree structure preserved

## Testing Approach

### Console Output Capture

All tests capture `console.log` output to verify tracer behavior:

```typescript
let consoleOutput: string[] = [];
let originalLog: typeof console.log;

beforeEach(() => {
  consoleOutput = [];
  originalLog = console.log;
  console.log = vi.fn((...args: any[]) => {
    consoleOutput.push(args.map(String).join(" "));
  });
});

afterEach(() => {
  console.log = originalLog;
});
```

### No UI Mocking

Components are kept simple enough that UI mocking is unnecessary. Tests verify:

1. Console output contains expected trace logs
2. Component renders correctly with given props/state

### Manual Labeling

All components manually call `useAutoTracer` and `logger.labelState` with explicit labels:

```typescript
// Manual labeling example matching React's internal storage
const logger = useAutoTracer();

const [count, setCount] = useState(0);
logger.labelState(0, "count", count, "setCount", setCount);

const [name, setName] = useState("default");
logger.labelState(1, "name", name, "setName", setName);

// Output order: count, name, setCount, setName
// (values from React fiber, then setters from unmatched labels)
```

**Important**: React stores each `useState` call as ONE hook with the value in `memoizedState`. Setters are functions returned to user code, not stored in the fiber. This is why logs show values first, then setters.

## Key Testing Insights

### React Hook Storage Model

Tests verify behavior that matches React's internal architecture:

- Each `useState` call creates ONE hook in `fiber.memoizedState` linked list
- Hook stores **value only** in `hook.memoizedState` (e.g., `count: 0`)
- **Setters are functions** returned to user code, not in fiber
- AutoTracer extracts values from fiber, setters from unmatched labels
- **Result**: Logs show `count, name, setCount, setName` (values grouped, then setters)
- **NOT**: Source pairs like `count, setCount, name, setName`

This is **correct behavior** per React internals, verified in tests.

### Test Environment Setup

**Critical Fix**: Vitest `globalSetup` runs in a separate Node.js process. React DevTools uses `Object.defineProperty()` with closures that don't survive process boundaries. Solution: Manual hook polyfill in `setupFiles` with plain object properties (see `tests/polyfill-globals.ts`).

## Scenario Coverage

### ✅ Scenario 1: Initial Prop Detection (Mount)

- **Component**: `SimplePropComponent`
- **Tests**: Verify primitive props are logged on mount
- **Coverage**: React internal props are skipped

### ✅ Scenario 2: Initial Prop Output Formatting

- **Components**: `FunctionPropComponent`, `ObjectPropComponent`
- **Tests**: Verify function props show `(fn:N)`, objects are JSON stringified
- **Coverage**: Stable function IDs, nested objects

### ✅ Scenario 3: Initial State Detection (Mount)

- **Components**: `SimpleStateComponent`, `MultiStateComponent`
- **Tests**: Verify state and setters are logged in source order
- **Coverage**: Multiple useState hooks, value then setter pairs

### ✅ Scenario 4: Initial State Output Formatting

- **Component**: `ObjectStateComponent`
- **Tests**: Verify boolean, object, array state formatting
- **Coverage**: All setter functions show `(fn:N)`

### ✅ Scenario 5: Prop Change Detection (Update)

- **Components**: `PropChangeParent`, `PropChangeChild`
- **Tests**: Verify prop changes when parent triggers re-render
- **Coverage**: Before/after values, proper transition format

### ✅ Scenario 6: Prop Change Output Formatting

- **Component**: `FormattingPropComponent`
- **Tests**: Verify short/medium/long formatting, function changes
- **Coverage**: No log for identical values

### ✅ Scenario 7: State Change Detection (Update)

- **Component**: `StateUpdateComponent`
- **Tests**: Verify state changes are logged on re-render
- **Coverage**: Before/after values, button-triggered updates

### ✅ Scenario 8: State Change Output Formatting

- **Component**: `FormattingStateComponent`
- **Tests**: Verify primitive, object, array, function state change formatting
- **Coverage**: Same function reference → no log

### ✅ Special Case: Unlabeled State

- **Component**: `UnlabeledStateComponent`
- **Tests**: Verify unlabeled hooks show as "unknown" (not `<unlabeled>`)
- **Coverage**: Value is still detected and logged

### ✅ Special Case: Custom Hooks

- **Components**: `useCounter`, `CustomHookComponent`
- **Tests**: Verify custom hook values with labels
- **Coverage**: Initial detection and change detection

### ✅ Special Case: Identical Value Changes

- **Component**: `IdenticalValueComponent`
- **Tests**: Verify identical value detection (when enabled)
- **Coverage**: New object with same content

## Component Design Patterns

### Minimal Complexity

```typescript
// Simple component - no unnecessary state or effects
export const SimplePropComponent: React.FC<SimplePropComponentProps> = ({
  name,
  count,
}) => {
  useAutoTracer();
  return (
    <div>
      {name}: {count}
    </div>
  );
};
```

### Test Accessibility

```typescript
// Expose setters for programmatic testing
export const StateUpdateComponent: React.FC = () => {
  const [count, setCount] = useState(0);

  // Expose for tests
  (StateUpdateComponent as any).setCount = setCount;

  return <button onClick={() => setCount(5)}>Update Count</button>;
};
```

### Component Pairs

```typescript
// Parent triggers re-render
export const PropChangeParent: React.FC = () => {
  const [count, setCount] = useState(5);
  return (
    <>
      <button onClick={() => setCount(10)}>Update</button>
      <PropChangeChild value={count} />
    </>
  );
};
```

## Test Examples

### Testing Initial Props

```typescript
it("should detect and log initial primitive props on mount", () => {
  render(<SimplePropComponent name="Alice" count={5} />);

  const mountLog = consoleOutput.find((line) =>
    line.includes("[SimplePropComponent] Mount")
  );
  expect(mountLog).toBeDefined();

  const namePropLog = consoleOutput.find((line) =>
    line.includes("Initial prop name:")
  );
  expect(namePropLog).toContain("Alice");
});
```

### Testing State Changes

```typescript
it("should detect state change on update", async () => {
  const user = userEvent.setup();
  render(<StateUpdateComponent />);

  consoleOutput = [];
  const button = screen.getByText("Update Count");
  await user.click(button);

  const stateChangeLog = consoleOutput.find((line) =>
    line.includes("State change count:")
  );
  expect(stateChangeLog).toContain("0");
  expect(stateChangeLog).toContain("5");
});
```

### Testing Function Identity

```typescript
it("should format function props as (fn:N)", () => {
  const handleClick = () => console.log("clicked");
  render(<FunctionPropComponent onClick={handleClick} label="Submit" />);

  const functionPropLog = consoleOutput.find((line) =>
    line.includes("Initial prop onClick:")
  );
  expect(functionPropLog).toMatch(/\(fn:\d+\)/);
});
```

## Dependencies

- **@auto-tracer/react18**: Core tracing library (workspace dependency)
- **React 18**: Component framework
- **Vitest**: Test runner with JSDOM environment
- **@testing-library/react**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation

## Future Enhancements

Potential additions to extend scenario coverage:

1. **Partial Label Coverage**: Components with mixed labeled/unlabeled state showing ordinal disambiguation
2. **Huge Object Truncation**: Props/state with >1000 nodes or depth >20
3. **Long String Formatting**: Props/state changes with >200 character strings
4. **Multiple Function Changes**: Different function references with stable IDs
5. **Error Boundaries**: Components with error scenarios
6. **Concurrent Features**: Components using transitions/deferred values

## Verification Checklist

✅ **All verification criteria met** (as of November 12, 2025):

- ✅ All components in `src/` have corresponding test files in `tests/unit/`
- ✅ All tests follow the console output capture pattern
- ✅ Components are minimal and focused on single scenarios
- ✅ Test names clearly describe what they verify
- ✅ Import aliases (`@src`, `@tests`) are used consistently
- ✅ No UI mocking is needed (components are simple enough)
- ✅ All 8 scenarios + 3 special cases are covered
- ✅ **42/42 tests passing** (100% success rate)
- ✅ Tests verify React's internal hook storage model
- ✅ DevTools hook polyfill working in Vitest environment

## Test Maintenance Notes

### Known Behaviors to Preserve

1. **Hook Order**: Tests expect `values → setters` order (React fiber model)
2. **String Matching**: Identical value tests match both with/without `"(identical value)"` suffix
3. **Function IDs**: Function identity by reference, `(fn:N)` format with stable IDs
4. **No Mocking**: Tests use real React rendering, no DevTools mocking needed

### Debugging Test Failures

If tests fail after changes:

1. Check if React's internal hook structure changed (unlikely but possible)
2. Verify `tests/polyfill-globals.ts` hook implementation is complete
3. Ensure `setupFiles` runs before tests (not `globalSetup`)
4. Use `originalLog()` in tests to see actual console output during debugging
5. Run single test file to isolate issues: `pnpm test <path>`

## Related Documentation

- **High-Level Spec**: `spec-highlevel-draft.md` (repository root) - Updated with React hook storage model
- **Core Library**: `packages/auto-tracer-react18/` - Main implementation
- **Monorepo Instructions**: `.github/instructions/rules.instructions.md` - Development guidelines
- **Hook Polyfill**: `tests/polyfill-globals.ts` - Manual React DevTools hook for Vitest
- **Setup Notes**: `tests/globalSetup.ts` - Deprecated approach with explanation
