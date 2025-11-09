import { describe, it, expect } from "vitest";
import { resolveHookLabel } from "@src/lib/functions/hookMapping/resolveHookLabel.js";
import type { Hook } from "@src/lib/functions/hookMapping/types.js";

describe("resolveHookLabel", () => {
  const createHook = (value: string): Hook => ({
    memoizedState: value,
    baseQueue: null,
    queue: { value },
    next: null,
  });

  it("should return fallback when hook is not in anchors array", () => {
    const hook = createHook("test");
    const anchors: Hook[] = [];
    const chainMap = new Map();
    const targets: number[] = [];
    const labels = {};

    const result = resolveHookLabel(hook, anchors, chainMap, targets, labels, "fallback");
    expect(result).toBe("fallback");
  });

  it("should return fallback when targetIndex is undefined", () => {
    const hook = createHook("test");
    const anchors = [hook];
    const chainMap = new Map([[hook, 0]]);
    const targets: number[] = []; // No target for this anchor
    const labels = {};

    const result = resolveHookLabel(hook, anchors, chainMap, targets, labels, "fallback");
    expect(result).toBe("fallback");
  });

  it("should return fallback when label is not found", () => {
    const hook = createHook("test");
    const anchors = [hook];
    const chainMap = new Map([[hook, 0]]);
    const targets = [5];
    const labels = {}; // No label at index 5

    const result = resolveHookLabel(hook, anchors, chainMap, targets, labels, "fallback");
    expect(result).toBe("fallback");
  });

  it("should return correct label for first anchor", () => {
    const hook = createHook("test");
    const anchors = [hook];
    const chainMap = new Map([[hook, 0]]);
    const targets = [0];
    const labels = { 0: "myLabel" };

    const result = resolveHookLabel(hook, anchors, chainMap, targets, labels, "fallback");
    expect(result).toBe("myLabel");
  });

  it("should map anchor index to correct target index", () => {
    const anchor0 = createHook("anchor0");
    const anchor7 = createHook("anchor7");
    const anchor14 = createHook("anchor14");

    const anchors = [anchor0, anchor7, anchor14];
    const chainMap = new Map([
      [anchor0, 0],
      [anchor7, 7],
      [anchor14, 14],
    ]);
    const targets = [0, 9, 18]; // Target indices in _debugHookTypes
    const labels = {
      0: "dispatch",
      9: "filteredTodos",
      18: "loading",
    };

    // Test anchor0 -> target[0] -> labels[0]
    expect(resolveHookLabel(anchor0, anchors, chainMap, targets, labels, "fallback"))
      .toBe("dispatch");

    // Test anchor7 -> target[9] -> labels[9]
    expect(resolveHookLabel(anchor7, anchors, chainMap, targets, labels, "fallback"))
      .toBe("filteredTodos");

    // Test anchor14 -> target[18] -> labels[18]
    expect(resolveHookLabel(anchor14, anchors, chainMap, targets, labels, "fallback"))
      .toBe("loading");
  });

  it("should handle the complete TodoList scenario", () => {
    // Simulate the TodoList fiber scenario from the analyze test
    const hook0 = createHook("state0");
    const hook7 = createHook("state7");
    const hook14 = createHook("state14");
    const hook21 = createHook("state21");
    const hook28 = createHook("state28");

    const anchors = [hook0, hook7, hook14, hook21, hook28];
    const chainMap = new Map([
      [hook0, 0],
      [hook7, 7],
      [hook14, 14],
      [hook21, 21],
      [hook28, 28],
    ]);
    const targets = [0, 9, 18, 27, 36];
    const labels = {
      0: "dispatch",
      9: "filteredTodos",
      18: "loading",
      27: "error",
      36: "filter",
    };

    expect(resolveHookLabel(hook0, anchors, chainMap, targets, labels, "state0"))
      .toBe("dispatch");
    expect(resolveHookLabel(hook7, anchors, chainMap, targets, labels, "state7"))
      .toBe("filteredTodos");
    expect(resolveHookLabel(hook14, anchors, chainMap, targets, labels, "state14"))
      .toBe("loading");
    expect(resolveHookLabel(hook21, anchors, chainMap, targets, labels, "state21"))
      .toBe("error");
    expect(resolveHookLabel(hook28, anchors, chainMap, targets, labels, "state28"))
      .toBe("filter");
  });
});
