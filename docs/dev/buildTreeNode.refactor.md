# buildTreeNode Refactor Plan

Target: `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/buildTreeNode.ts`

Status: Planning only — no code changes in this document.

## Objectives

- Reduce cyclomatic complexity to ≤ 5 per function.
- Remove unsafe type assertions and replace with type guards under strict TS.
- Keep fiber input immutable; clarify/document controlled side effects.
- Decompose responsibilities into single‑purpose modules (one export per file, named exports only).
- Preserve external behavior; add exhaustive tests first (TDD) with 100% unit coverage for new modules.
- Improve performance for hook label resolution (avoid O(n²) index lookups).

## Observed Issues (Current)

- Purity claim vs side effects: uses `componentLogRegistry.consumeLogs` and `savePrevLabelsForGuid`.
- Type assertions: `const fiberNode = fiber as {...}` and `as Hook`.
- Mixed concerns: render type detection, state deltas, prop deltas, label resolution, logs consumption, and identical‑value flagging in one function.
- Potential O(n²): repeated `anchors.indexOf(hook)` within maps.
- Name collision risk: `matchedLabels` set keyed only by label name.

## Design Principles

- Concern-based grouping and pipeline phases per repo rules.
- One top-level symbol per file; named exports only.
- Functional, immutable transformations. Document any necessary side effects in TSDoc.
- Strict TypeScript; prefer type guards to assertions.

## Module Decomposition

Create focused helpers under the same concern tree. Filenames must match exported symbols exactly.

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/determineRenderType.ts`
  - export `determineRenderType(fiberNode: FiberLike): "Mount" | "Rendering" | "Skipped"`

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/isFiberLike.ts`
  - export `isFiberLike(value: unknown): value is FiberLike`
  - Defines `FiberLike` minimal shape used by `buildTreeNode`.

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/mapAnchorsToIndices.ts`
  - export `mapAnchorsToIndices(anchors: ReadonlyArray<Hook>): ReadonlyMap<Hook, number>`

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/stateChanges/buildStateChangesOnMount.ts`
  - export `buildStateChangesOnMount(args): StateChange[]`
  - Inputs: `{ fiberNode: FiberLike, trackingGUID: string | null, anchors: Hook[], allAnchors: {index:number;value:unknown}[] }`

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/stateChanges/buildStateChangesOnUpdate.ts`
  - export `buildStateChangesOnUpdate(args): StateChange[]`
  - Inputs additionally include previous labels snapshot and `traceOptions`.

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/props/buildPropChanges.ts`
  - export `buildPropChanges(fiberNode: FiberLike, isNewMount: boolean, displayName?: string): PropChange[]`

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/computeIdenticalWarning.ts`
  - export `computeIdenticalWarning(stateChanges: StateChange[], propChanges: PropChange[]): boolean`

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/consumeComponentLogsByGuid.ts`
  - export `consumeComponentLogsByGuid(guid: string | null): ComponentLog[]`
  - TSDoc must explicitly state side effect (consumes/clears logs).

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/safeResolveHookLabel.ts`
  - export `safeResolveHookLabel(guid: string | null, anchorIndex: number, memoizedState: unknown, allAnchors: AnchorSummary[]): string`
  - Clearly define behavior when `guid` is null (untracked fallback).

- `packages/auto-tracer-react18/src/lib/functions/treeProcessing/building/types/FiberLike.ts`
  - export `FiberLike` (minimal, local type for this pipeline stage).

`buildTreeNode.ts` then becomes a small orchestrator that:
- Validates input via `isFiberLike`.
- Computes `renderType` via `determineRenderType`.
- Prepares anchors and `Map<Hook, number>` via `mapAnchorsToIndices`.
- Delegates state/prop extraction to the respective modules.
- Delegates identical-warning aggregation.
- Delegates log consumption to a helper with explicit side-effect docs.

## TSDoc Updates

- Update `buildTreeNode` TSDoc to: “Pure w.r.t. the fiber object; performs controlled side effects in registries (logs consumption and label snapshotting). See individual helpers for details.”
- Every new helper must include TSDoc, including parameters, return types, and side-effect notices where applicable.

## Test Plan (TDD)

Follow repo rules: tests under `tests/` mirroring `src/`. Start by writing failing tests, then implement minimal changes to pass.

Unit tests (100% coverage for new modules):

- `packages/auto-tracer-react18/tests/unit/lib/functions/treeProcessing/building/determineRenderType.test.ts`
  - Mount vs Rendering (`hasRenderWork`) vs Skipped.

- `.../building/isFiberLike.test.ts`
  - Guards true for valid shapes; false for invalid; narrows types.

- `.../building/mapAnchorsToIndices.test.ts`
  - Correct indices, stability, and fast lookups.

- `.../building/stateChanges/buildStateChangesOnMount.test.ts`
  - Includes unmatched label-only values; skips internal and marker values; correct resolved names.

- `.../building/stateChanges/buildStateChangesOnUpdate.test.ts`
  - Emits only deltas (prev defined, ref changed, not markers); unmatched labels with prev snapshot; identical detection toggle with `traceOptions`.

- `.../building/props/buildPropChanges.test.ts`
  - Mount path uses `memoizedProps || pendingProps`; update path deltas; filters `children` and `getSkippedProps`.

- `.../building/computeIdenticalWarning.test.ts`
  - True when any change has identical flag; otherwise false.

- `.../building/consumeComponentLogsByGuid.test.ts`
  - Returns and clears logs for a GUID; noop for null/absent.

- `.../building/safeResolveHookLabel.test.ts`
  - Behavior with/without GUID; stable fallback for untracked.

Integration tests (≥80% coverage for building folder):

- `packages/auto-tracer-react18/tests/integration/lib/functions/treeProcessing/building/buildTreeNode.useState.integration.test.ts`
  - Keep existing suites; extend with cases for identical value detection and unmatched label changes.

- `packages/auto-tracer-react18/tests/lib/functions/treeProcessing/buildTreeNode.unmatched.identical.test.ts`
  - Ensure behavior preserved post-refactor.

Acceptance/integration harness:

- Run `@auto-tracer/react18-proof` tests to validate behavior against spec.

## Step-by-Step Plan

1) Tests First (no code changes):
- Add unit tests for the new helpers (failing initially).
- Add/extend integration tests around `buildTreeNode` behaviors (identical detection, unmatched labels, logs consumption).

2) Minimal Orchestrator Refactor:
- Introduce `isFiberLike` and use it in `buildTreeNode` (remove `as` cast).
- Extract `determineRenderType`, `mapAnchorsToIndices`, `buildPropChanges`, and state change helpers.
- Replace inline identical-warning aggregation with `computeIdenticalWarning`.
- Replace direct `componentLogRegistry.consumeLogs` with `consumeComponentLogsByGuid` (document side effect).
- Replace direct `resolveHookLabel` usage with `safeResolveHookLabel` to unify untracked behavior.

3) Behavior Preservation and Docs:
- Ensure all public behavior matches pre-refactor tests.
- Update TSDoc in orchestrator and new helpers to document side effects and constraints.

4) Performance Check:
- Verify no O(n²) anchor lookups remain; use precomputed `Map<Hook, number>`.

5) Verification

Always run from repo root as per rules.

- Focused build/tests:
```powershell
pnpm --filter @auto-tracer/react18 build
pnpm --filter @auto-tracer/react18 test
pnpm --filter @auto-tracer/react18-proof test
```

- Full monorepo check (feature done):
```powershell
pnpm build
pnpm test
```

## Risks & Mitigations

- Name collision in labels: consider disambiguation when detecting unmatched labels (e.g., track `[label, anchorIndex]` internally while keeping outward label string unchanged). Validate with tests.
- Untracked components: define stable fallback path for label resolution in `safeResolveHookLabel`; document in README if externally observable.
- Side effects: make them explicit and local to a single helper to keep `buildTreeNode` predictable and easy to reason about.

## Approval Notes

- This plan introduces new files and moves logic via cut/paste. Per repo rules, file moves/deletions require explicit permission. Implementation will: (a) add helpers, (b) cut/paste logic into helpers without semantic changes, (c) reduce `buildTreeNode` to orchestration. No deletions or relocations of existing files will occur without prior approval.
