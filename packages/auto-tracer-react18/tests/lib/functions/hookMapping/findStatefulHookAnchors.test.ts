import { describe, it, expect } from "vitest";
import { findStatefulHookAnchors } from "@src/lib/functions/hookMapping/findStatefulHookAnchors.js";
import type { Hook } from "@src/lib/functions/hookMapping/types.js";

describe("findStatefulHookAnchors", () => {
  it("should return empty array when firstHook is null", () => {
    const result = findStatefulHookAnchors(null);
    expect(result).toEqual([]);
  });

  it("should return empty array when firstHook is undefined", () => {
    const result = findStatefulHookAnchors(undefined);
    expect(result).toEqual([]);
  });

  it("should return hook when it has a queue", () => {
    const hook: Hook = {
      memoizedState: "value",
      baseQueue: null,
      queue: { pending: null },
      next: null,
    };
    const result = findStatefulHookAnchors(hook);
    expect(result).toEqual([hook]);
  });

  it("should skip hook when queue is null", () => {
    const hook: Hook = {
      memoizedState: "value",
      baseQueue: null,
      queue: null,
      next: null,
    };
    const result = findStatefulHookAnchors(hook);
    expect(result).toEqual([]);
  });

  it("should skip hook when queue is undefined", () => {
    const hook: Hook = {
      memoizedState: "value",
      baseQueue: null,
      queue: undefined,
      next: null,
    };
    const result = findStatefulHookAnchors(hook);
    expect(result).toEqual([]);
  });

  it("should find multiple hooks with queues in a chain", () => {
    const hook3: Hook = {
      memoizedState: "value3",
      baseQueue: null,
      queue: { pending: null },
      next: null,
    };
    const hook2: Hook = {
      memoizedState: "value2",
      baseQueue: null,
      queue: null, // No queue
      next: hook3,
    };
    const hook1: Hook = {
      memoizedState: "value1",
      baseQueue: null,
      queue: { pending: null },
      next: hook2,
    };
    const hook0: Hook = {
      memoizedState: "value0",
      baseQueue: null,
      queue: { pending: null },
      next: hook1,
    };

    const result = findStatefulHookAnchors(hook0);
    expect(result).toEqual([hook0, hook1, hook3]);
  });

  it("should walk a long chain and find only hooks with queues", () => {
    // Create a chain: queue, no-queue, no-queue, queue, no-queue, queue
    const hook5: Hook = {
      memoizedState: "value5",
      baseQueue: null,
      queue: { value: "end" },
      next: null,
    };
    const hook4: Hook = {
      memoizedState: "value4",
      baseQueue: null,
      queue: null,
      next: hook5,
    };
    const hook3: Hook = {
      memoizedState: "value3",
      baseQueue: null,
      queue: { value: "middle" },
      next: hook4,
    };
    const hook2: Hook = {
      memoizedState: "value2",
      baseQueue: null,
      queue: null,
      next: hook3,
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
      queue: { value: "start" },
      next: hook1,
    };

    const result = findStatefulHookAnchors(hook0);
    expect(result).toEqual([hook0, hook3, hook5]);
    expect(result.length).toBe(3);
  });
});
