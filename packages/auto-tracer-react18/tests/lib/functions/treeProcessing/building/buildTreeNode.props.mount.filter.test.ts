import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildTreeNode } from "@src/lib/functions/treeProcessing/building/buildTreeNode.js";

// Mock skipped props to include 'skipMe'
vi.mock("@src/lib/functions/getSkippedProps.js", async (orig) => {
  const mod = await orig<any>();
  return {
    ...mod,
    getSkippedProps: (displayName?: string) => {
      const s = new Set<string>();
      s.add("skipMe");
      return s;
    },
  };
});

function createFiberOnMount(props: Record<string, unknown>) {
  const fiber: any = {
    elementType: { name: "Demo" },
    type: { name: "Demo" },
    flags: 0,
    memoizedProps: props,
    pendingProps: props,
    memoizedState: null,
  };
  delete fiber.alternate; // simulate mount
  return fiber;
}

describe("buildTreeNode - props mount filtering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("filters out children and skipped props on mount", () => {
    const fiber = createFiberOnMount({
      children: "CHILDREN",
      skipMe: 123,
      keepMe: 456,
    });

    const node = buildTreeNode(fiber, 0);
    const names = node.propChanges.map((p) => p.name);
    expect(names).toEqual(["keepMe"]);
    expect(node.propChanges[0]?.prevValue).toBeUndefined();
  });
});
