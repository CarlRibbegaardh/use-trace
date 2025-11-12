import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";
import type { Hook } from "@src/lib/functions/hookMapping/types.js";
import {
  addLabelForGuid,
  clearAllHookLabels,
  clearLabelsForGuid,
  savePrevLabelsForGuid,
} from "@src/lib/functions/hookLabels.js";
import { registerTrackedGUID } from "@src/lib/functions/renderRegistry.js";
import { traceOptions } from "@src/lib/types/globalState.js";
import { getPrevLabelsForGuid } from "@src/lib/functions/hookLabels.js";

function createTrackingRefHook(guid: string): Hook {
  return {
    memoizedState: { current: guid },
    baseState: { current: guid },
    baseQueue: null,
    queue: null,
    next: null,
  } as unknown as Hook;
}

function chainHooks(hooks: Hook[]): Hook | null {
  if (hooks.length === 0) return null;
  for (let i = 0; i < hooks.length - 1; i++) hooks[i]!.next = hooks[i + 1]!;
  return hooks[0]!;
}

function createFiber(guid: string, withAlternate = true) {
  const memoizedState = chainHooks([createTrackingRefHook(guid)]);
  const alt = withAlternate
    ? {
        elementType: { name: "X" },
        type: { name: "X" },
        memoizedState,
      }
    : null;

  return {
    elementType: { name: "Comp" },
    type: { name: "Comp" },
    alternate: alt,
    flags: 1,
    memoizedProps: {},
    pendingProps: {},
    memoizedState,
    _debugHookTypes: ["useRef"],
    child: null,
    sibling: null,
  };
}

describe("buildTreeNode - unmatched labeled values identical detection", () => {
  const guid = "render-track-unmatched-identical";

  beforeEach(() => {
    clearAllHookLabels();
    // Enable identical detection for this test
    traceOptions.detectIdenticalValueChanges = true;
  });

  afterEach(() => {
    clearAllHookLabels();
  });

  it("marks unmatched labeled deep-equal values as identical changes", () => {
    // Previous render labels (normalized internally)
    addLabelForGuid(guid, {
      index: 0,
      label: "messages",
      value: {
        exit: () => {},
        log: () => {},
        state: () => {},
      },
    });
    // Snapshot as previous
    savePrevLabelsForGuid(guid);
  // Sanity: previous snapshot should be present
  expect(getPrevLabelsForGuid(guid).length).toBe(1);

    // New render labels with different function refs but same logical structure
    clearLabelsForGuid(guid);
    addLabelForGuid(guid, {
      index: 0,
      label: "messages",
      value: {
        exit: () => {},
        log: () => {},
        state: () => {},
      },
    });

    const fiber = createFiber(guid, true);
    // Mark this GUID as tracked so builder considers labeled values
    registerTrackedGUID(guid);
    const node = buildTreeNode(fiber, 0);

    // Expect one unmatched labeled change surfaced
    const change = node.stateChanges.find((c) => c.name === "messages");
    expect(change).toBeDefined();
    // It should be considered an identical value change (deep-equal content)
    expect(change!.isIdenticalValueChange).toBe(true);
  });
});
