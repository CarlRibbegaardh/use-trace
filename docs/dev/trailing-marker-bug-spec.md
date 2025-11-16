# Trailing Marker Bug Specification

## Problem Statement

The tree rendering system outputs **trailing markers** (collapse markers without subsequent content nodes) and displays **incorrect indentation** for markers that should be filtered out.

## Bug Manifestation

### Settings Required to Reproduce

```typescript
autoTracer({
  enabled: true,
  showFlags: true,
  includeNonTrackedBranches: true,
  includeRendered: "forState",
  includeMount: "never",
  maxFiberDepth: 100,
  filterEmptyNodes: "all",
  enableAutoTracerInternalsLogging: true,
  detectIdenticalValueChanges: true,
});
```

**Critical settings:**

- `filterEmptyNodes: "all"` - Enables marker creation for collapsed sequences
- `enableAutoTracerInternalsLogging: true` - Shows Level and Filtered nodes count in markers

### Example Incorrect Output

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state count: 0
  │   Initial state setCount: (fn:1)
  └─┐ ... (Level: 19, Filtered nodes: 89)    ← BUG: Incorrect indentation (no parent)
  ├─ [SourceGreeting] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state name: World
  │   Initial state setName: (fn:2)
  └─┐ ... (Level: 20, Filtered nodes: 66)    ← BUG: Trailing marker (no content follows)
```

### Example Correct Output (Default Mode)

**Default behavior:**

```
└─┐ ... (47 levels collapsed)
  ├─ [BuiltCounter] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state count: 0
  │   Initial state setCount: (fn:1)
  ├─ [SourceGreeting] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state name: World
  │   Initial state setName: (fn:2)
```

**Note:**

- The single marker shows filtered ancestor count: `(47 levels collapsed)`
- BuiltCounter and SourceGreeting are both visible siblings at Level 19
- BuiltCounterFiltered (the third sibling) and its descendants (89 nodes total) are invisible
- The trailing Level 20 marker is removed because it has no content
- Maintains existing UX while fixing the sibling marker bug

### Example Correct Output (Internal Debug Mode)

**With `enableAutoTracerInternalsLogging: true`:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state count: 0
  │   Initial state setCount: (fn:1)
  │ ... (Filtered nodes: 89)
  ├─ [SourceGreeting] Mount (PerformedWork, PassiveUnmountPendingDev) ⚡
  │   Initial state name: World
  │   Initial state setName: (fn:2)
```

**Note:**

- The opening marker shows Level 19 and filtered ancestor count (47)
- Inline continuation marker `│ ... (Filtered nodes: 89)` shows filtered sibling (BuiltCounterFiltered) and its descendants
- This format is ONLY for internal debugging to see what's being filtered
- Could also show trailing filtered content: `│ ... (Filtered nodes: N)` at the end if present

## Detailed Bug Analysis

### Bug #1: Trailing Markers Displayed

**Problem:** Markers appear at the end of the tree with no content nodes following them.

**Examples:**

1. **Cycle 1, Line 9:**

   ```
   └─┐ ... (Level: 20, Filtered nodes: 66)
   ```

   This marker has nothing after it and should not be displayed.

2. **Cycle 3, entire output:**
   ```
   └─┐ ... (Level: 1, Filtered nodes: 228)
   ```
   The entire cycle filtered down to one marker with no content - should produce NO output.

**Rule:** A marker should only be rendered if there is at least one non-marker node following it in the tree.

### Bug #2: Multiple Markers for Siblings

**Problem:** When siblings exist at the same level with some filtered, the system creates separate markers for each group instead of one unified marker.

**Incorrect:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
└─┐ ... (Level: 19, Filtered nodes: 89)      ← BUG: Separate marker for filtered sibling
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Correct (Default Mode):**

```
└─┐ ... (47 levels collapsed)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Correct (Internal Debug Mode - `enableAutoTracerInternalsLogging: true`):**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  │ ... (Filtered nodes: 89)
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Rule:**

- Filtered siblings are omitted from the tree structure
- Only filtered **ancestors** get an opening marker
- In **default mode**: Filtered siblings are completely invisible, marker shows `(N levels collapsed)`
- In **internal debug mode**: Filtered siblings shown as inline continuation markers `│ ... (Filtered nodes: N)` for debugging visibility

## Tree Structure Examples

### Example 1: Siblings with Filtered Sibling Between

**Structure:**

- Filtered ancestors (Levels 1-18): 47 nodes
- Level 19 siblings:
  - BuiltCounter (visible)
  - BuiltCounterFiltered (filtered, + 89 descendants)
  - SourceGreeting (visible)

**Correct Rendering (Default Mode):**

```
└─┐ ... (47 levels collapsed)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Correct Rendering (Internal Debug Mode):**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  │ ... (Filtered nodes: 89)
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Key points:**

- Single opening marker for filtered ancestors: `(47 levels collapsed)`
- Both visible siblings at visual depth 1
- Default mode: BuiltCounterFiltered completely invisible
- Internal debug mode: Inline marker shows filtered sibling location and count (89)

### Example 2: Nested Marker with Content

**Structure:**

- Level 19 Marker → BuiltCounter (Level 19)
  - Level 24 Marker → SomeChildComponent (Level 24)
- Level 19 Marker → SourceGreeting (Level 19)

**Correct Rendering:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  └─┐ ... (Level: 24, Filtered nodes: X)
    ├─ [SomeChildComponent] Mount
    │   Initial state foo: bar
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Indentation breakdown:**

- Level 19 marker: visual depth 0 (0 spaces) - represents filtered ancestors
- BuiltCounter: visual depth 1 (2 spaces)
- Level 24 marker: visual depth 1 (2 spaces, after BuiltCounter's state lines)
- SomeChildComponent: visual depth 2 (4 spaces)
- SourceGreeting: visual depth 1 (2 spaces, sibling to BuiltCounter)

### Example 3: Trailing Marker (Should Not Render)

**Structure:**

- Filtered ancestors (Levels 1-18): 47 nodes
- Level 19 siblings: BuiltCounter, SourceGreeting (both visible)
- Level 20: Filtered descendants with no visible content

**Correct Rendering:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

The Level 20 marker is **not rendered** because it has no visible content following it.

### Example 4: Entire Cycle is Markers Only (Should Not Render)

**Structure:**

- Level 1 Marker → (nothing)

**Correct Rendering:**

```
(no output)
```

When filtering reduces the entire tree to just markers with no content, **nothing should be rendered**.

## Technical Requirements

### Output Modes

The system supports two output modes controlled by `enableAutoTracerInternalsLogging`:

**Default Mode (`enableAutoTracerInternalsLogging: false`):**

- Markers show `└─┐ ... (N levels collapsed)` with ancestor count
- Filtered siblings are completely invisible
- Maintains existing UX that users are familiar with
- Shows helpful hint about filtered content without excessive detail

**Internal Debug Mode (`enableAutoTracerInternalsLogging: true`):**

- Markers show `└─┐ ... (Level: N, Filtered nodes: X)` with precise level info
- Filtered siblings shown as inline continuation markers: `│ ... (Filtered nodes: N)`
- Helps debugging by showing what's being filtered and where
- Inline markers appear between visible siblings at the same visual depth as state lines
- Can show trailing filtered content if present

### Marker Rendering Rules

1. **Trailing Marker Detection:**

   - Before rendering a marker, check if the next node in the tree exists and is not a marker
   - If next node is null OR next node is also a marker, skip rendering this marker

2. **Visual Depth Calculation:**

   - Opening markers represent filtered **ancestors** from root down to first visible level
   - All visible siblings at the same level appear at the same visual depth under one opening marker
   - Filtered siblings are omitted (clean mode) or shown as inline continuation markers (debug mode)
   - Inline continuation markers use `│ ... (Filtered nodes: N)` format at the same indent as component state lines
   - Nested markers (for filtered descendants) indent relative to their parent component

3. **Empty Cycle Handling:**
   - If the filtered tree contains only marker nodes, render nothing
   - The cycle header should still be logged, but no tree content

### Indentation Rules

Using **U+2007 FIGURE SPACE** (2 per level):

- Visual depth 0: No indentation (markers at root level)
- Visual depth 1: 2 figure spaces (children of root markers)
- Visual depth 2: 4 figure spaces (nested children)
- Visual depth N: N \* 2 figure spaces

### State/Prop Detail Lines

Component state and prop change lines should use:

```
<indent>│   <content>
```

Where:

- `<indent>`: Same figure spaces as the component line
- `│`: Box drawing vertical line
- Three spaces after the pipe
- `<content>`: The state/prop information

## Affected Components

### Primary Files

1. **`renderTreeNode.ts`** - Marker rendering logic

   - Needs trailing marker detection
   - Needs correct visual depth handling

2. **`filterAllEmptyNodes.ts`** (or similar filtering logic)

   - May need to filter out trailing markers during tree building
   - Or mark markers as "trailing" for rendering logic to skip

3. **`renderTree.ts`** (or tree rendering orchestrator)
   - May need empty tree detection before rendering

### Testing Files

1. **Marker rendering integration tests** (already failing)

   - `markerRendering.integration.test.ts`

2. **New regression test needed:**
   - Test trailing marker detection
   - Test empty cycle (markers only) handling
   - Test correct visual depth for sibling vs nested markers

## Acceptance Criteria

### ✅ Success Criteria

1. **No trailing markers:**

   - Markers without following content are not rendered
   - Cycles that filter to only markers produce no tree output (only cycle header)

2. **Correct indentation:**

   - Sibling markers at same original level have same visual depth
   - Nested markers indent correctly based on parent depth
   - Figure spaces preserve indentation on copy/paste from browser console

3. **All existing tests pass:**
   - Marker rendering integration tests
   - Tree filtering tests
   - Indentation tests

### ❌ Failure Indicators

1. Last line of tree output is a marker (Level N, Filtered nodes: X)
2. Sibling markers (same Level) have different indentation
3. Empty cycles show marker output instead of no output
4. Copy/paste from console loses indentation (figure spaces not working)

## Test Scenarios

### Test Case 1: Siblings with Filtered Sibling Between

**Input:** Three components at Level 19 (BuiltCounter, BuiltCounterFiltered, SourceGreeting) where the middle one is filtered

**Expected Output (Default Mode):**

```
└─┐ ... (47 levels collapsed)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

**Expected Output (Internal Debug Mode):**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  │ ... (Filtered nodes: 89)
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

### Test Case 2: Nested Marker with Content

**Input:** Component at Level 19 with child at Level 24

**Expected Output:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  └─┐ ... (Level: 24, Filtered nodes: X)
    ├─ [SomeChildComponent] Mount
    │   Initial state foo: bar
```

### Test Case 3: Trailing Marker Filtered Out

**Input:** Visible siblings at Level 19, trailing filtered descendants at Level 20 with no visible content

**Expected Output:**

```
└─┐ ... (Level: 19, Filtered nodes: 47)
  ├─ [BuiltCounter] Mount
  │   Initial state count: 0
  ├─ [SourceGreeting] Mount
  │   Initial state name: World
```

(Level 20 trailing marker not shown)

### Test Case 4: Empty Cycle

**Input:** Entire tree filters to one marker with no content

**Expected Output:**

```
Component render cycle 3:
(no tree output)
```

## Implementation Notes

### Suggested Approach

1. **Add trailing marker detection in rendering:**

   ```typescript
   // In renderTree or renderTreeNode
   function shouldRenderMarker(node: TreeNode, nextNode?: TreeNode): boolean {
     if (node.renderType !== "Marker") return true;

     // Don't render if no next node
     if (!nextNode) return false;

     // Don't render if next node is also a marker
     if (nextNode.renderType === "Marker") return false;

     return true;
   }
   ```

2. **Fix visual depth for sibling markers:**

   - Track whether we're rendering inside a marker's content
   - Reset visual depth when returning to same original level

3. **Handle empty cycles:**

   ```typescript
   function renderTree(nodes: TreeNode[]): void {
     // Filter out trailing markers
     const renderableNodes = nodes.filter((node, i, arr) =>
       shouldRenderMarker(node, arr[i + 1])
     );

     // Don't render if only markers remain
     if (renderableNodes.length === 0) return;

     // Render nodes...
   }
   ```

## References

- **Issue Thread:** Trailing marker bug discussion
- **Related Files:**
  - `packages/auto-tracer-react18/src/lib/functions/treeProcessing/rendering/renderTreeNode.ts`
  - `packages/auto-tracer-react18/src/lib/functions/treeProcessing/filtering/filterAllEmptyNodes.ts`
  - `packages/auto-tracer-react18/tests/lib/functions/treeProcessing/rendering/markerRendering.integration.test.ts`
