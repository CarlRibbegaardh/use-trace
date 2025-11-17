import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { traceOptions } from "@src/lib/types/globalState.js";

function createFiberWithAlternate(prevProps: Record<string, unknown>, currProps: Record<string, unknown>) {
  const prev = {
    elementType: { name: "Demo" },
    type: { name: "Demo" },
    flags: 0,
    memoizedProps: prevProps,
    pendingProps: prevProps,
    memoizedState: null,
  } as const;
  const fiber = {
    elementType: { name: "Demo" },
    type: { name: "Demo" },
    alternate: prev,
    flags: 1,
    memoizedProps: currProps,
    pendingProps: currProps,
    memoizedState: null,
  } as const;
  return fiber;
}

describe("buildTreeNode - prop identical value detection on update", () => {
  const orig = { ...traceOptions };
  beforeEach(() => {
    Object.assign(traceOptions, orig);
  });
  afterEach(() => {
    Object.assign(traceOptions, orig);
  });

  it("flags identical value change when enabled and refs differ", () => {
    Object.assign(traceOptions, { detectIdenticalValueChanges: true });

    const prev = { cfg: { a: 1 } };
    const curr = { cfg: { a: 1 } }; // deep equal, different ref
    const fiber = createFiberWithAlternate(prev, curr);

    const node = buildTreeNode(fiber, 0);
    const change = node.propChanges.find((c) => c.name === "cfg");
    expect(change).toBeTruthy();
    expect(change?.prevValue).not.toBe(change?.value);
    expect(change?.isIdenticalValueChange).toBe(true);
  });

  it("does not flag when disabled", () => {
    Object.assign(traceOptions, { detectIdenticalValueChanges: false });

    const prev = { cfg: { a: 1 } };
    const curr = { cfg: { a: 1 } };
    const fiber = createFiberWithAlternate(prev, curr);

    const node = buildTreeNode(fiber, 0);
    const change = node.propChanges.find((c) => c.name === "cfg");
    expect(change).toBeTruthy();
    expect(change?.isIdenticalValueChange).toBeFalsy();
  });
});
