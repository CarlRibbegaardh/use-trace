import { describe, it, expect } from "vitest";
import { createHookChainIndexMap } from "@src/lib/functions/hookMapping/createHookChainIndexMap.js";
import type { Hook } from "@src/lib/functions/hookMapping/types.js";

describe("createHookChainIndexMap", () => {
  it("should return empty map when firstHook is null", () => {
    const result = createHookChainIndexMap(null);
    expect(result.size).toBe(0);
  });

  it("should return empty map when firstHook is undefined", () => {
    const result = createHookChainIndexMap(undefined);
    expect(result.size).toBe(0);
  });

  it("should map single hook to position 0", () => {
    const hook: Hook = {
      memoizedState: "value",
      baseQueue: null,
      queue: null,
      next: null,
    };
    const result = createHookChainIndexMap(hook);
    expect(result.size).toBe(1);
    expect(result.get(hook)).toBe(0);
  });

  it("should map hooks to sequential positions", () => {
    const hook2: Hook = {
      memoizedState: "value2",
      baseQueue: null,
      queue: null,
      next: null,
    };
    const hook1: Hook = {
      memoizedState: "value1",
      baseQueue: null,
      queue: null,
      next: hook2,
    };
    const hook0: Hook = {
      memoizedState: "value0",
      baseQueue: null,
      queue: null,
      next: hook1,
    };

    const result = createHookChainIndexMap(hook0);
    expect(result.size).toBe(3);
    expect(result.get(hook0)).toBe(0);
    expect(result.get(hook1)).toBe(1);
    expect(result.get(hook2)).toBe(2);
  });

  it("should handle a long chain correctly", () => {
    // Build a chain of 10 hooks
    let currentHook: Hook | null = null;
    const hooks: Hook[] = [];

    for (let i = 9; i >= 0; i--) {
      const hook: Hook = {
        memoizedState: `value${i}`,
        baseQueue: null,
        queue: i % 3 === 0 ? { value: i } : null, // Some with queues, some without
        next: currentHook,
      };
      hooks.unshift(hook);
      currentHook = hook;
    }

    const result = createHookChainIndexMap(hooks[0]!);
    expect(result.size).toBe(10);

    // Verify each hook is at the correct position
    hooks.forEach((hook, index) => {
      expect(result.get(hook)).toBe(index);
    });
  });
});
