import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { componentLogRegistry } from "@src/lib/functions/componentLogRegistry.js";
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

function createFiberWithOnlyTrackingRef(componentName: string, guid: string, alternate?: unknown) {
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

describe("buildTreeNode - componentLogs consumption", () => {
  const guid = "render-track-logs-guid-1";
  beforeEach(() => {
    registerTrackedGUID(guid);
    componentLogRegistry.clear();
  });
  afterEach(() => {
    componentLogRegistry.clear();
    clearRenderRegistry();
  });

  it("returns logs for tracked GUID and consumes them", () => {
    componentLogRegistry.addLog(guid, 'log', "First", 1);
    componentLogRegistry.addLog(guid, 'warn', "Second", 2);

    const fiber = createFiberWithOnlyTrackingRef("Demo", guid, {});
    const node = buildTreeNode(fiber, 0);

    expect(node.isTracked).toBe(true);
    expect(node.trackingGUID).toBe(guid);
    expect(node.componentLogs).toHaveLength(2);
    expect(node.componentLogs[0]!.message).toBe("First");
    expect(node.componentLogs[1]!.level).toBe('warn');

    // Subsequent consumption should be empty
    const node2 = buildTreeNode(fiber, 0);
    expect(node2.componentLogs).toEqual([]);
  });
});
