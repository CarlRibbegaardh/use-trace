import { describe, it, expect } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";

function createMinimalFiber({ alternate, flags }: { alternate?: unknown; flags?: number }) {
  return {
    elementType: { name: "X" },
    type: { name: "X" },
    alternate,
    flags: flags ?? 0,
    memoizedProps: {},
    pendingProps: {},
    memoizedState: null,
  } as const;
}

describe("buildTreeNode - renderType", () => {
  it("returns Mount when no alternate present", () => {
    const fiber = createMinimalFiber({ flags: 0 });

    const node = buildTreeNode(fiber, 0);
    expect(node.renderType).toBe("Mount");
  });

  it("returns Rendering when alternate present and flags indicate work", () => {
    const prev = createMinimalFiber({ flags: 0 });
    const fiber = createMinimalFiber({ alternate: prev, flags: 1 }); // 1 should be treated as having render work
    const node = buildTreeNode(fiber, 0);
    expect(node.renderType).toBe("Rendering");
  });

  it("returns Skipped when alternate present and no work flags", () => {
    const prev = createMinimalFiber({ flags: 0 });
    const fiber = createMinimalFiber({ alternate: prev, flags: 0 });
    const node = buildTreeNode(fiber, 0);
    expect(node.renderType).toBe("Skipped");
  });
});
