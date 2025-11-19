import { describe, expect, it, vi } from "vitest";
import { snapshotValue } from "@src/lib/functions/snapshotValue.js";

// Mock getFunctionId to return stable IDs for testing
vi.mock("@src/lib/functions/getFunctionId.js", () => {
  return {
    getFunctionId: vi.fn(() => {
      return 123;
    }),
  };
});

describe("snapshotValue", () => {
  it("should pass through primitives", () => {
    expect(snapshotValue(1)).toBe(1);
    expect(snapshotValue("test")).toBe("test");
    expect(snapshotValue(true)).toBe(true);
    expect(snapshotValue(null)).toBe(null);
    expect(snapshotValue(undefined)).toBe(undefined);
  });

  it("should replace functions with (fn:ID) strings", () => {
    const fn = () => {};
    expect(snapshotValue(fn)).toBe("(fn:123)");
  });

  it("should deep clone objects", () => {
    const obj = { a: 1, b: { c: 2 } };
    const snapshot = snapshotValue(obj);

    expect(snapshot).toEqual(obj);
    expect(snapshot).not.toBe(obj);
    expect((snapshot as Record<string, unknown>).b).not.toBe(obj.b);
  });

  it("should deep clone arrays", () => {
    const arr = [1, { a: 2 }];
    const snapshot = snapshotValue(arr);

    expect(snapshot).toEqual(arr);
    expect(snapshot).not.toBe(arr);
    expect((snapshot as unknown[])[1]).not.toBe(arr[1]);
  });

  it("should handle circular references by replacing with [Circular]", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;

    const snapshot = snapshotValue(obj);

    expect((snapshot as Record<string, unknown>).a).toBe(1);
    expect((snapshot as Record<string, unknown>).self).toBe("[Circular]");
  });

  it("should handle diamond dependencies (DAGs) correctly", () => {
    // A -> B, A -> C, B -> D, C -> D
    // D should be cloned twice? Or referenced?
    // If we want a pure tree for JSON.stringify, we must clone D twice.
    // If we want a graph for DevTools, we could keep the reference.
    // But snapshotValue is supposed to be "safe clone".
    // If we keep reference, JSON.stringify works fine (it handles DAGs).
    // But if we modify the clone's D, does it affect the other D?
    // Ideally snapshotValue produces a structure where shared references are preserved
    // IF they are not circular.
    // However, to be safe and simple, treating it as a tree (cloning D twice) is safer for mutation?
    // But standard JSON.stringify behavior on DAGs is to just emit D twice.
    // Let's see what happens if we just clone.

    const d = { val: "d" };
    const b = { d };
    const c = { d };
    const a = { b, c };

    const snapshot = snapshotValue(a) as Record<string, Record<string, unknown>>;

    expect(snapshot.b?.d).toEqual({ val: "d" });
    expect(snapshot.c?.d).toEqual({ val: "d" });

    // If we implement strict tree cloning, these are different objects
    expect(snapshot.b?.d).not.toBe(snapshot.c?.d);
  });

  it("should respect maxDepth", () => {
    const obj = { a: { b: { c: { d: 1 } } } };
    // Depth: root=0, a=1, b=2, c=3, d=4
    // If maxDepth=2, we should see root -> a -> b -> [Max Depth]
    // Wait, if maxDepth is 2:
    // root (0) -> ok
    // a (1) -> ok
    // b (2) -> ok
    // c (3) -> replaced with [Max Depth]

    const snapshot = snapshotValue(obj, 1000, 2);

    expect(snapshot).toEqual({
      a: {
        b: {
          c: "[Max Depth]"
        }
      }
    });
  });

  it("should respect maxNodes", () => {
    // Create object with 5 nodes: root, a, b, c, d
    const obj = { a: 1, b: 2, c: 3, d: 4 };

    // If maxNodes=2 (root + 1 prop?), we might stop early.
    // Implementation detail: how we count nodes.
    // Usually root is 1.

    const _snapshot = snapshotValue(obj, 2, 20);

    // Should contain some props but not all?
    // Or should it return a "Too Large" marker for the whole thing?
    // The requirement says "For trees beyond the limit: include a summary node rather than full expansion."
    // If we are *inside* the tree and hit the limit, we probably truncate.

    // Let's assume we truncate the remaining keys.
    // This test depends on implementation order.
    // If we process keys in order a, b, c, d...

    // Actually, if maxNodes is hit, we might just stop adding properties.
    // Let's verify it returns a valid object but missing some keys or having a marker.

    const snap = snapshotValue(obj, 2, 20) as Record<string, unknown>;
    // Root (1) + a (1) = 2 nodes.
    // Next prop 'b' would make it 3.

    // Expectation: partial object?
    // Or maybe we replace the rest with "[Max Nodes]"?

    // Let's assert that it doesn't crash and returns something reasonable.
    expect(typeof snap).toBe("object");
    // Should have at least one prop
    expect(Object.keys(snap).length).toBeLessThan(Object.keys(obj).length);
  });
});
