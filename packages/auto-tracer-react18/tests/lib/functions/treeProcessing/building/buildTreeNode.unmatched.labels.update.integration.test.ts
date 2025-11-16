import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { addLabelForGuid, clearAllHookLabels } from "@src/lib/functions/hookLabels.js";
import { registerTrackedGUID, clearRenderRegistry } from "@src/lib/functions/renderRegistry.js";
import type { Hook } from "@src/lib/functions/hookMapping/types.js";

function createTrackingRefHook(guid: string): Hook {
  return {
    memoizedState: { current: guid },
    baseState: { current: guid },
    baseQueue: null,
    queue: null,
    next: null,
  };
}

function chainHooks(hooks: Hook[]): Hook | null {
  if (hooks.length === 0) return null;
  for (let i = 0; i < hooks.length - 1; i++) hooks[i]!.next = hooks[i + 1]!;
  return hooks[0]!;
}

function createFiberWithTrackingOnly(componentName: string, guid: string, alternate?: unknown) {
  const memoizedState = chainHooks([createTrackingRefHook(guid)]);
  return {
    elementType: { name: componentName },
    type: { name: componentName },
    alternate,
    flags: 1,
    memoizedProps: {},
    pendingProps: {},
    memoizedState,
    _debugHookTypes: ["useRef"],
  } as const;
}

describe("buildTreeNode - unmatched labeled values on update", () => {
  const guid = "render-track-unmatched-guid";
  beforeEach(() => {
    registerTrackedGUID(guid);
  });
  afterEach(() => {
    clearAllHookLabels();
    clearRenderRegistry();
  });

  it("emits unmatched labeled change on second update using prev snapshot", () => {
    // First update: label exists (no state hooks), buildTreeNode should snapshot prev labels
    addLabelForGuid(guid, { label: "externalFn", index: 0, value: function v1() {} });
    const prev = createFiberWithTrackingOnly("C", guid);
    const fiber1 = createFiberWithTrackingOnly("C", guid, prev);
    const n1 = buildTreeNode(fiber1, 0);
    // No state hooks -> no matched labels; no unmatched change yet because there is no prev value
    expect(n1.stateChanges.length === 0 || n1.stateChanges.every((c) => c.name !== "externalFn")).toBe(true);

    // Second update: change label reference
    clearAllHookLabels();
    addLabelForGuid(guid, { label: "externalFn", index: 0, value: function v2() {} });
    const fiber2 = createFiberWithTrackingOnly("C", guid, prev);
    const n2 = buildTreeNode(fiber2, 0);

    const change = n2.stateChanges.find((c) => c.name === "externalFn");
    expect(change).toBeTruthy();
    expect(change?.prevValue).not.toBe(change?.value);
  });
});
