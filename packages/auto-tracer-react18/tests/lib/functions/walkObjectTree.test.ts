import { describe, expect, it } from "vitest";
import { walkObjectTree } from "@src/lib/functions/walkObjectTree.js";

describe("walkObjectTree", () => {
  const MAX_NODES = 100;
  const MAX_DEPTH = 10;

  it("should count nodes in a simple object", () => {
    const obj = { a: 1, b: 2 };
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      MAX_NODES,
      MAX_DEPTH
    );

    expect(result).toBe(true);
    // Root object (1) + a (1) + b (1) = 3
    expect(nodeCount.count).toBe(3);
  });

  it("should count nodes in nested objects", () => {
    const obj = { a: { b: { c: 3 } } };
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      MAX_NODES,
      MAX_DEPTH
    );

    expect(result).toBe(true);
    // Root (1) + a (1) + b (1) + c (1) = 4
    expect(nodeCount.count).toBe(4);
  });

  it("should count nodes in arrays", () => {
    const obj = [1, { a: 2 }, [3]];
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      MAX_NODES,
      MAX_DEPTH
    );

    expect(result).toBe(true);
    // Root array (1)
    // Index 0: 1 (1)
    // Index 1: {a:2} (1) + a:2 (1) = 2
    // Index 2: [3] (1) + 0:3 (1) = 2
    // Total = 1 + 1 + 2 + 2 = 6
    expect(nodeCount.count).toBe(6);
  });

  it("should return false when maxNodes is exceeded", () => {
    const obj = { a: { b: { c: 3 } } };
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();
    const smallMaxNodes = 2;

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      smallMaxNodes,
      MAX_DEPTH
    );

    expect(result).toBe(false);
    // Should have stopped after exceeding limit
    expect(nodeCount.count).toBeGreaterThan(smallMaxNodes);
  });

  it("should return false when maxDepth is exceeded", () => {
    const obj = { a: { b: { c: 3 } } };
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();
    const smallMaxDepth = 1;

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      MAX_NODES,
      smallMaxDepth
    );

    expect(result).toBe(false);
  });

  it("should handle circular references without infinite recursion", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const nodeCount = { count: 0 };
    const visited = new WeakSet<object>();

    const result = walkObjectTree(
      obj,
      0,
      nodeCount,
      visited,
      MAX_NODES,
      MAX_DEPTH
    );

    expect(result).toBe(true);
    // Root (1). The circular reference is visited but not counted again as a new node?
    // Actually, walkObjectTree increments count BEFORE checking visited for the root call,
    // but for recursive calls, it checks visited inside the loop?
    // Let's check the implementation:
    // It increments count.
    // Then checks visited.
    // So if we pass the same object again, it increments count again?
    // No, wait.
    // Implementation:
    // nodeCount.count++;
    // if (visited.has(value)) return true;
    // visited.add(value);
    //
    // So if we encounter a circular ref:
    // 1. Root obj: count=1, visited={obj}, recurse on 'self'
    // 2. 'self' is obj: count=2, visited has obj -> return true.
    // So count will be 3 (Root + a + self).
    expect(nodeCount.count).toBe(3);
  });
});
