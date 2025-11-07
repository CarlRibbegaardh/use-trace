# State Name Analysis: From Injection to Logging

This document provides a methodical, step-by-step breakdown of how state labels flow from build-time injection in `apps/todo-example-vite-injected/src/components/TodoList.tsx` through runtime rendering and logging in `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`. The goal is to trace how friendly names like "filteredTodos" replace generic "stateN" labels.


## Overview

The process involves three main phases:
1. **Build-time Injection**: Vite plugin transforms source code to inject label calls.
2. **Runtime Label Storage**: Labels are stored during component initialization.
3. **Runtime Resolution and Logging**: During rendering, labels are resolved and used in logs.


## Phase 1: Build-time Injection


### Step 1.1: Source Code Scanning

- **Location**: `apps/todo-example-vite-injected/src/components/TodoList.tsx`

- **Process**: The Vite plugin (`packages/auto-tracer-plugin-vite/`) scans the source code for React hook calls (e.g., `useState`, `useReducer`).

- **Details**: It identifies stateful hooks that need labeling. For example, in TodoList.tsx:
  ```typescript
  export const TodoList: React.FC<TodoListProps> = ({ todoService }) => {
    const dispatch = useAppDispatch();
    const filteredTodos = useAppSelector(selectFilteredTodos);
    const loading = useAppSelector(selectTodosLoading);
    const error = useAppSelector(selectTodosError);
    const filter = useAppSelector(selectTodosFilter);
  ```
  Here, `useAppSelector` calls are stateful hooks (they use internal state via Redux). The plugin identifies these as needing labels based on the variable names.

  The Vite plugin is configured with `labelHooks` (a set of specific hook names) and/or `labelHooksPattern` (a regex for matching hook names). `useAppSelector` is included in this configuration because it's a stateful hook that subscribes to Redux state changes. During AST scanning, the plugin checks each hook call: if the hook name is in `hookNameSet` (from `labelHooks`) or matches `hookNameRegex` (from `labelHooksPattern`), it's marked for labeling. The label is derived from the variable name assigned to the hook's return value (e.g., `filteredTodos` from `const filteredTodos = useAppSelector(...)`). This ensures only configured stateful hooks get labels, preventing over-injection.

- **Limitation**: The AST scanner only analyzes the component's source code syntactically. It does NOT follow imports or analyze hook implementations in `node_modules`. For example, if `useAppDispatch` internally uses `useState`, that nested call is invisible to the build-time transformation. The system relies entirely on explicit configuration (`labelHooks`/`labelHooksPattern`) to identify stateful hooks, not runtime behavior analysis.

- **Key Function**: `injectIntoBlockStatementDirect` in `packages/auto-tracer-inject-react18/src/functions/transform/helpers/injectIntoBlockStatementDirect.ts` performs AST transformation.

**Impact on Logging**: Without this step, no labels would be injected, leading to "stateN" fallbacks in logs.


### Step 1.2: Hook Position Computation

- **Process**: The injector recursively collects all React hook call expressions in source order, including nested hooks (e.g., inside custom hooks or conditionals).

- **Algorithm**:
  - Scans the component's function body.
  - Builds an ordered list of hook calls (`orderedCalls`).
  - Assigns a `hookPosition` (0-based index) to each stateful hook based on its position in this list.

- **Example**: For the TodoList code:
  - `useAppDispatch()` is the first hook (index 0) but not labeled (not in configuration)
  - `useAppSelector(selectFilteredTodos)` is the second hook → index 1 for "filteredTodos".
  - `useAppSelector(selectTodosLoading)` is the third hook → index 2 for "loading".
  - `useAppSelector(selectTodosError)` is the fourth hook → index 3 for "error".
  - `useAppSelector(selectTodosFilter)` is the fifth hook → index 4 for "filter".

- **Limitation**: All hooks (including non-stateful ones like `useAppDispatch()`) are counted in position computation, but only hooks matching `isKnownStateHook` (useState/useReducer) or `isConfiguredHook` (in labelHooks set or matching labelHooksPattern) get labels injected. This means the index assigned to a labeled hook depends on ALL preceding hooks, not just labeled ones.

- **Edge Cases**: Nested hooks (e.g., inside `useMemo`) are included in the order to ensure accurate positioning.

**Impact on Logging**: Incorrect indexing here would misalign labels, e.g., "filteredTodos" might be logged as "state1" instead of "state0".


### Step 1.3: Code Injection

- **Process**: After each stateful hook declaration, the injector inserts `logger.labelState(label, hookPosition);`.

- **Example Transformation**:
  ```typescript
  // Original TodoList code
  export const TodoList: React.FC<TodoListProps> = ({ todoService }) => {
    const dispatch = useAppDispatch();
    const filteredTodos = useAppSelector(selectFilteredTodos);
    const loading = useAppSelector(selectTodosLoading);
    const error = useAppSelector(selectTodosError);
    const filter = useAppSelector(selectTodosFilter);

  // Transformed (injected code)
  export const TodoList: React.FC<TodoListProps> = ({ todoService }) => {
    const dispatch = useAppDispatch();
    const filteredTodos = useAppSelector(selectFilteredTodos);
    logger.labelState('filteredTodos', 0);
    const loading = useAppSelector(selectTodosLoading);
    logger.labelState('loading', 1);
    const error = useAppSelector(selectTodosError);
    logger.labelState('error', 2);
    const filter = useAppSelector(selectTodosFilter);
    logger.labelState('filter', 3);
  ```

- **Bug/Issue**: The injected indices (0, 1, 2, 3) assume `useAppDispatch` is NOT counted, but the actual `collectHookCalls` function counts ALL hooks (including `useAppDispatch`). This creates a mismatch: if `useAppDispatch` is at position 0 and `useAppSelector(filteredTodos)` is at position 1, the label 'filteredTodos' gets stored at index 1, not 0. **However, we KNOW from prior work that build-time indices do NOT directly align with runtime `_debugHookTypes` indices.** The runtime uses pattern matching (anchor-to-target mapping) to find the correct positions, which means the build-time index (e.g., 1) and the runtime target index (e.g., 9) are completely different. This is why the mapping logic exists in `findStatefulHookAnchors` and `findStatefulHookTargets`.

- **Critical Issue**: The current implementation stores labels using build-time indices (0, 1, 2, 3) but attempts to retrieve them using runtime target indices (e.g., 9, 10, 11, 12). Since these index spaces are unrelated, the lookup always fails, causing "stateN" fallbacks. The pattern matching correctly finds which hooks are stateful at runtime, but the label registry uses the wrong index key.

- **Expected Behavior - Unlabeled Stateful Hooks**: There will most likely be stateful hooks that we don't mark at build-time because:
  1. They are not `useState` or `useReducer` (the only auto-detected hooks)
  2. They are not in the `labelHooks` configuration
  3. They don't match the `labelHooksPattern` regex
  4. They are nested inside custom hooks from `node_modules` (invisible to AST scanning)
  
  For example, if `useAppDispatch` internally uses `useSyncExternalStore` (a stateful hook), we won't label it. These unlabeled stateful hooks **must be correctly identified during runtime logging and rendered as "stateN"** where N is their runtime target index. This is expected and correct behavior—not all stateful hooks need friendly names, only those explicitly configured for labeling.

- **Label Source**: The label is derived from the variable name (e.g., 'filteredTodos').

- **Output**: The transformed code is written to the build output, ready for runtime execution.

**Impact on Logging**: This injection ensures labels are set at runtime; without it, the registry remains empty, forcing "stateN" fallbacks.


## Phase 2: Runtime Label Storage


### Step 2.1: Component Initialization

- **Location**: During the first render of TodoList.tsx.

- **Process**: As the component executes, the injected `logger.labelState(label, index)` calls are executed.

- **Key Function**: `renderRegistry.ts` in `packages/auto-tracer-react18/src/lib/functions/renderRegistry.ts`.
  - `logger.labelState(label, index)` validates the index (mandatory) and calls `addLabelForGuid(guid, label, index)`.

- **Example**: When TodoList renders, `logger.labelState('filteredTodos', 0)` stores 'filteredTodos' at index 0 for the component's GUID.

**Impact on Logging**: Storage happens once per component; if skipped, labels won't be available for resolution.


### Step 2.2: Label Registry Storage

- **Location**: `packages/auto-tracer-react18/src/lib/functions/hookLabels.ts`

- **Process**: Labels are stored in a per-component registry keyed by the component's GUID.
  - Structure: `Record<number, string>` where key is the index, value is the label.
  - Example: For TodoList's GUID, {0: 'filteredTodos', 1: 'loading', 2: 'error', 3: 'filter'}.

- **Persistence**: Labels persist across renders until the component unmounts or `clearRenderRegistry` is called.

**Impact on Logging**: The registry enables label lookup; missing entries result in "stateN" instead of friendly names.


## Phase 3: Runtime Resolution and Logging


### Step 3.1: Fiber Walking Initiation

- **Location**: `packages/auto-tracer-react18/src/lib/functions/walkFiberForUpdates.ts`

- **Trigger**: Called during React's render cycle (e.g., after state updates).

- **Process**: Walks the React fiber tree to inspect component updates.

- **Example**: When filteredTodos changes, walkFiberForUpdates is triggered for TodoList's fiber.

**Impact on Logging**: Initiates the resolution process; no walking means no logging.


### Step 3.2: Hook Discovery

- **Process**: For each fiber node representing a component:
  - Scans the `memoizedState` linked list for hooks.
  - Identifies "anchors": hooks with queues (indicating stateful hooks like useState).

- **Key Concept**: Anchors are the runtime hook objects that correspond to state changes.

- **Example**: In TodoList, the useAppSelector for filteredTodos has a queue, making it an anchor.

**Impact on Logging**: Only anchored hooks get labels resolved; others remain "stateN".


### Step 3.3: Anchor-to-Target Mapping

- **Process**: Maps anchors to "targets" using React's internal `_debugHookTypes` array.
  - `_debugHookTypes` is a blueprint of all hooks in the component, in the order they appear.
  - Stateful hooks (useState, useReducer, etc.) have specific indices in this array.

- **Algorithm**:
  - Find the position of each anchor in the `memoizedState` chain.
  - Map that position to the corresponding index in `_debugHookTypes`.
  - Example: If the first stateful hook is at position 0 in memoizedState, and it's the 10th hook in _debugHookTypes, target index = 9 (0-based).

- **Bug/Issue**: The mapping assumes build-time indices align with runtime `_debugHookTypes` indices. If the build-time count includes hooks that React doesn't track (or vice versa), the mapping breaks. For example, if `useAppDispatch` is counted at build-time (index 0) but doesn't create a memoizedState entry at runtime, the anchor-to-target mapping will be off by one, causing 'filteredTodos' (stored at index 1) to be looked up at the wrong target index.

- **KNOWN FACT**: Build-time indices and runtime target indices are NOT aligned. The entire purpose of `findStatefulHookAnchors` and `findStatefulHookTargets` is to use pattern matching to map runtime anchors (hooks with queues in `memoizedState`) to their positions in `_debugHookTypes`. This mapping is complex because:
  - Build-time counts ALL hooks in source order (indices 0, 1, 2, 3, 4...)
  - Runtime `_debugHookTypes` includes ALL hooks React tracked (indices may be 0, 1, 2, ..., 9, 10, 11...)
  - The pattern matching finds which `_debugHookTypes` indices correspond to stateful hooks (e.g., indices 9, 10, 11, 12)
  - **The bug is that labels are stored using build-time indices but retrieved using runtime target indices from pattern matching**

- **Key Functions**: `findStatefulHookAnchors` and `findStatefulHookTargets` in `packages/auto-tracer-react18/src/lib/functions/hookMapping/`.

- **Example**: For TodoList, anchor for filteredTodos maps to target index 9 in _debugHookTypes.

**Impact on Logging**: Accurate mapping ensures the correct label is fetched; mismatches lead to wrong or missing labels.


### Step 3.4: Label Resolution

- **Process**: For each target index, query the label registry using `resolveHookLabel(guid, targetIndex)`.
  - If a label exists for that index, use it (e.g., 'filteredTodos').
  - If not, fall back to 'stateN' where N is the target index.

- **Key Function**: `resolveHookLabel` in `hookLabels.ts`, which calls `getLabelsForGuid(guid)[targetIndex]`.

- **Example**: For target 9, if registry has 'filteredTodos' at 9, log "filteredTodos updated"; else "state9 updated".

- **Bug/Issue**: If the build-time index doesn't match the runtime target index (due to counting mismatches or anchor-to-target mapping errors), the lookup fails. For example, if 'filteredTodos' is stored at index 1 but the runtime target index is 9, `resolveHookLabel(guid, 9)` returns undefined, falling back to "state9" instead of "filteredTodos". This is the root cause of "stateN" appearing in logs.

- **ROOT CAUSE CONFIRMED**: We KNOW from the pattern matching work that build-time indices (where labels are stored: 0, 1, 2, 3) and runtime target indices (where labels are retrieved: 9, 10, 11, 12) are in completely different index spaces. The pattern matching correctly identifies stateful hooks at runtime, but the label storage/retrieval uses incompatible index keys. **The fix requires either:**
  1. Storing labels using runtime target indices (requires runtime index discovery before labeling)
  2. Mapping build-time indices to runtime target indices during resolution (requires a bridge between the two index spaces)
  3. Using a different key than index (e.g., hook name + position within that hook type)

**Impact on Logging**: Direct control over friendly vs. generic names; failures here cause "stateN".


### Step 3.5: Logging Output

- **Process**: Incorporates the resolved label into log messages.

- **Example Output**: Instead of "state9 updated", logs "filteredTodos updated" (the relevant label for the hook at target index 9).

- **Fallback**: If mapping fails or label is missing, defaults to "stateN".

**Impact on Logging**: Final step where user sees the result; successful resolution shows relevant labels like "filteredTodos", "loading", "error", or "filter" instead of generic "stateN".


## Key Challenges and Notes

- **Index Accuracy**: Build-time indices must align with runtime _debugHookTypes positions. Mismatches lead to wrong labels or fallbacks.

- **CRITICAL BUG - Index Space Mismatch**: The current implementation assumes all hooks counted at build-time have corresponding entries in React's runtime structures (`memoizedState`, `_debugHookTypes`). However, **we KNOW from the pattern matching implementation that build-time indices and runtime target indices are in completely different index spaces**.
  - Build-time: Counts all hooks in source order (0, 1, 2, 3, 4...)
  - Runtime: `_debugHookTypes` may have different indices (0, 1, 2, ..., 9, 10, 11...)
  - Pattern matching maps anchors to targets correctly, but labels are stored at build-time indices and retrieved at runtime target indices
  - **This mismatch is the root cause of all "stateN" fallbacks**

- **The Pattern Matching Solution**: The `findStatefulHookAnchors` and `findStatefulHookTargets` functions successfully identify which hooks are stateful at runtime, but the label registry doesn't use the mapping they provide. The fix must bridge the two index spaces.

- **Nested Hooks**: The injector accounts for nesting to ensure correct ordering.

- **Component GUID**: Ensures labels are scoped to the correct component instance.

- **No Code Changes**: This analysis is based on current implementation; any fixes must follow TDD (failing test first).


## Summary Flow

1. Vite scans TodoList.tsx → computes hook positions → injects labelState calls.
2. Runtime executes labelState → stores labels by index in registry.
3. walkFiberForUpdates walks fiber → maps anchors to targets → resolves labels → logs with friendly names.

**CRITICAL FLAW IN FLOW**: Step 2 stores labels using build-time indices (0, 1, 2, 3), but Step 3 retrieves labels using runtime target indices from pattern matching (9, 10, 11, 12). These index spaces are unrelated, causing lookup failures and "stateN" fallbacks. The pattern matching in Step 3 correctly identifies stateful hooks, but the label registry uses incompatible keys.

This methodical tracing identifies why the system fails to replace "stateN" with meaningful labels like "filteredTodos": **the storage and retrieval use different index spaces**.
