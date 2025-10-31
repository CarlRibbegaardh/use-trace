import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@src/lib/functions/log.js", () => {
  return {
    logWarn: vi.fn(),
  };
});

describe("extractUseStateValues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return empty array for null fiber node", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const result = extractUseStateValues(null as unknown as Record<string, unknown>);

      expect(result).toEqual([]);
    });

    it("should return empty array for undefined fiber node", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const result = extractUseStateValues(undefined as unknown as Record<string, unknown>);

      expect(result).toEqual([]);
    });

    it("should return empty array for non-object fiber node", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const result1 = extractUseStateValues("string" as unknown as Record<string, unknown>);
      const result2 = extractUseStateValues(123 as unknown as Record<string, unknown>);
      const result3 = extractUseStateValues(true as unknown as Record<string, unknown>);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    it("should return empty array for fiber node without memoizedState", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {};
      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });

    it("should return empty array for fiber node with null memoizedState", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = { memoizedState: null };
      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });
  });

  describe("useState hook detection", () => {
    it("should extract single useState value", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "test-value",
          queue: { dispatch: vi.fn() },
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "test-value",
          prevValue: undefined,
        },
      ]);
    });

    it("should extract multiple useState values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "first-value",
          queue: { dispatch: vi.fn() },
          next: {
            memoizedState: 42,
            queue: { dispatch: vi.fn() },
            next: {
              memoizedState: true,
              queue: { dispatch: vi.fn() },
              next: null,
            },
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "first-value",
          prevValue: undefined,
        },
        {
          name: "state1",
          value: 42,
          prevValue: undefined,
        },
        {
          name: "state2",
          value: true,
          prevValue: undefined,
        },
      ]);
    });

    it("should skip hooks without queue (non-useState hooks)", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "ref-value",
          // No queue - this is likely useRef
          next: {
            memoizedState: "state-value",
            queue: { dispatch: vi.fn() },
            next: null,
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state1",
          value: "state-value",
          prevValue: undefined,
        },
      ]);
    });

    it("should handle hooks with undefined memoizedState", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          // memoizedState is undefined but has queue - this is useState with undefined value
          memoizedState: undefined,
          queue: { dispatch: vi.fn() },
          next: {
            memoizedState: "valid-state",
            queue: { dispatch: vi.fn() },
            next: null,
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: undefined,
          prevValue: undefined,
        },
        {
          name: "state1",
          value: "valid-state",
          prevValue: undefined,
        },
      ]);
    });
  });

  describe("previous state extraction", () => {
    it("should extract previous state values from alternate fiber", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "new-value",
          queue: { dispatch: vi.fn() },
          next: null,
        },
        alternate: {
          memoizedState: {
            memoizedState: "old-value",
            next: null,
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "new-value",
          prevValue: "old-value",
        },
      ]);
    });

    it("should handle multiple hooks with previous values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "new-first",
          queue: { dispatch: vi.fn() },
          next: {
            memoizedState: "new-second",
            queue: { dispatch: vi.fn() },
            next: null,
          },
        },
        alternate: {
          memoizedState: {
            memoizedState: "old-first",
            next: {
              memoizedState: "old-second",
              next: null,
            },
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "new-first",
          prevValue: "old-first",
        },
        {
          name: "state1",
          value: "new-second",
          prevValue: "old-second",
        },
      ]);
    });

    it("should handle mismatched hook chains between current and previous", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "new-first",
          queue: { dispatch: vi.fn() },
          next: {
            memoizedState: "new-second",
            queue: { dispatch: vi.fn() },
            next: null,
          },
        },
        alternate: {
          memoizedState: {
            memoizedState: "old-first",
            next: null, // Previous chain is shorter
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "new-first",
          prevValue: "old-first",
        },
        {
          name: "state1",
          value: "new-second",
          prevValue: undefined,
        },
      ]);
    });

    it("should handle fiber without alternate", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "value",
          queue: { dispatch: vi.fn() },
          next: null,
        },
        // No alternate
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "value",
          prevValue: undefined,
        },
      ]);
    });

    it("should handle alternate without memoizedState", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "value",
          queue: { dispatch: vi.fn() },
          next: null,
        },
        alternate: {
          // No memoizedState
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: "value",
          prevValue: undefined,
        },
      ]);
    });
  });

  describe("hook chain traversal limits", () => {
    it("should limit traversal to 20 hooks maximum", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      // Create a chain of 25 hooks
      let currentHook: Record<string, unknown> | null = null;
      for (let i = 24; i >= 0; i--) {
        currentHook = {
          memoizedState: `value-${i}`,
          queue: { dispatch: vi.fn() },
          next: currentHook,
        };
      }

      const fiberNode = {
        memoizedState: currentHook,
      };

      const result = extractUseStateValues(fiberNode);

      // Should only extract first 20 hooks
      expect(result).toHaveLength(20);
      expect(result[0]).toEqual({
        name: "state0",
        value: "value-0",
        prevValue: undefined,
      });
      expect(result[19]).toEqual({
        name: "state19",
        value: "value-19",
        prevValue: undefined,
      });
    });

    it("should handle circular references in hook chain", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const hook1: Record<string, unknown> = {
        memoizedState: "value1",
        queue: { dispatch: vi.fn() },
        next: null,
      };

      const hook2: Record<string, unknown> = {
        memoizedState: "value2",
        queue: { dispatch: vi.fn() },
        next: hook1,
      };

      // Create circular reference
      hook1.next = hook2;

      const fiberNode = {
        memoizedState: hook1,
      };

      const result = extractUseStateValues(fiberNode);

      // Should stop at the limit and not hang
      expect(result).toHaveLength(20);
      expect(result[0]).toEqual({
        name: "state0",
        value: "value1",
        prevValue: undefined,
      });
    });
  });

  describe("complex state values", () => {
    it("should handle object state values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const objectValue = { count: 10, name: "test" };
      const fiberNode = {
        memoizedState: {
          memoizedState: objectValue,
          queue: { dispatch: vi.fn() },
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: objectValue,
          prevValue: undefined,
        },
      ]);
    });

    it("should handle array state values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const arrayValue = [1, 2, 3];
      const fiberNode = {
        memoizedState: {
          memoizedState: arrayValue,
          queue: { dispatch: vi.fn() },
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: arrayValue,
          prevValue: undefined,
        },
      ]);
    });

    it("should handle null state values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: null,
          queue: { dispatch: vi.fn() },
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: null,
          prevValue: undefined,
        },
      ]);
    });

    it("should handle function state values", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const functionValue = () => {
        return "test";
      };
      const fiberNode = {
        memoizedState: {
          memoizedState: functionValue,
          queue: { dispatch: vi.fn() },
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state0",
          value: functionValue,
          prevValue: undefined,
        },
      ]);
    });
  });

  describe("error handling", () => {
    it("should handle errors during hook traversal and call logWarn", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      // Create a malformed hook that will cause an error when accessed
      const problematicHook = {};
      Object.defineProperty(problematicHook, "queue", {
        get() {
          throw new Error("Simulated fiber access error");
        },
      });

      const fiberNode = {
        memoizedState: problematicHook,
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Error extracting useState values:",
        expect.any(Error)
      );
    });

    it("should return empty array when hook structure is completely malformed", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          // Missing expected properties
          someRandomProperty: "value",
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });

    it("should handle getters that throw errors", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const problematicFiber = {};
      Object.defineProperty(problematicFiber, "memoizedState", {
        get() {
          throw new Error("Cannot access memoizedState");
        },
      });

      const result = extractUseStateValues(problematicFiber);

      expect(result).toEqual([]);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Error extracting useState values:",
        expect.any(Error)
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty hook chain", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: null,
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });

    it("should handle hook with null queue", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "value",
          queue: null,
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });

    it("should handle hook with undefined queue", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          memoizedState: "value",
          // queue is undefined
          next: null,
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([]);
    });

    it("should handle mixed hook types in chain", async () => {
      const { extractUseStateValues } = await import("@src/lib/functions/extractUseStateValues.js");

      const fiberNode = {
        memoizedState: {
          // First hook: useRef (no queue)
          memoizedState: { current: "ref-value" },
          next: {
            // Second hook: useState (has queue)
            memoizedState: "state-value",
            queue: { dispatch: vi.fn() },
            next: {
              // Third hook: useEffect (no queue, no memoizedState)
              next: {
                // Fourth hook: useState (has queue)
                memoizedState: 42,
                queue: { dispatch: vi.fn() },
                next: null,
              },
            },
          },
        },
      };

      const result = extractUseStateValues(fiberNode);

      expect(result).toEqual([
        {
          name: "state1",
          value: "state-value",
          prevValue: undefined,
        },
        {
          name: "state3",
          value: 42,
          prevValue: undefined,
        },
      ]);
    });
  });
});
