import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock dependencies
vi.mock("@src/lib/features/autoTracer/functions/componentLogRegistry.js", () => {
  return {
    componentLogRegistry: {
      addLog: vi.fn(),
      clear: vi.fn(),
    },
  };
});

describe("renderRegistry", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the internal state by clearing the registry
    const { clearRenderRegistry } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");
    clearRenderRegistry();
  });

  describe("useAutoTrace", () => {
    it("should generate a unique GUID on first render", async () => {
      const { useAutoTrace } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const { result } = renderHook(() => {
        return useAutoTrace();
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.log).toBe("function");
    });

    it("should maintain the same GUID across re-renders", async () => {
      const { useAutoTrace, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const { rerender } = renderHook(() => {
        return useAutoTrace();
      });

      const firstGuids = getTrackedGUIDs();
      expect(firstGuids.size).toBe(1);
      const firstGuid = Array.from(firstGuids)[0];

      rerender();

      const secondGuids = getTrackedGUIDs();
      expect(secondGuids.size).toBe(1);
      const secondGuid = Array.from(secondGuids)[0];

      expect(firstGuid).toBe(secondGuid);
    });

    it("should generate different GUIDs for different component instances", async () => {
      const { useAutoTrace, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      renderHook(() => {
        return useAutoTrace();
      });

      renderHook(() => {
        return useAutoTrace();
      });

      const guids = getTrackedGUIDs();
      expect(guids.size).toBe(2);

      const guidArray = Array.from(guids);
      expect(guidArray[0]).not.toBe(guidArray[1]);
      guidArray.forEach((guid) => {
        expect(typeof guid).toBe("string");
        expect(guid).toMatch(/^render-track-\d+-\d+$/);
      });
    });

    it("should create a logger that calls componentLogRegistry.addLog with GUID", async () => {
      const { componentLogRegistry } = vi.mocked(
        await import("@src/lib/features/autoTracer/functions/componentLogRegistry.js")
      );
      const { useAutoTrace } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const { result } = renderHook(() => {
        return useAutoTrace();
      });

      const logger = result.current;
      logger.log("test message", "arg1", 42);

      expect(componentLogRegistry.addLog).toHaveBeenCalledTimes(1);
      expect(componentLogRegistry.addLog).toHaveBeenCalledWith(
        expect.stringMatching(/^render-track-\d+-\d+$/),
        "test message",
        "arg1",
        42
      );
    });

    it("should return the same logger instance on re-renders", async () => {
      const { useAutoTrace } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const { result, rerender } = renderHook(() => {
        return useAutoTrace();
      });

      const firstLogger = result.current;

      rerender();

      const secondLogger = result.current;

      expect(firstLogger).toBe(secondLogger);
    });

    it("should handle multiple log calls with the same GUID", async () => {
      const { componentLogRegistry } = vi.mocked(
        await import("@src/lib/features/autoTracer/functions/componentLogRegistry.js")
      );
      const { useAutoTrace } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const { result } = renderHook(() => {
        return useAutoTrace();
      });

      const logger = result.current;
      logger.log("message 1");
      logger.log("message 2", "arg");

      expect(componentLogRegistry.addLog).toHaveBeenCalledTimes(2);

      const mockAddLog = vi.mocked(componentLogRegistry.addLog);
      const calls = mockAddLog.mock.calls;
      expect(calls).toHaveLength(2);

      const [firstCall, secondCall] = calls;
      expect(firstCall![0]).toBe(secondCall![0]); // Same GUID
      expect(firstCall![1]).toBe("message 1");
      expect(secondCall![1]).toBe("message 2");
      expect(secondCall![2]).toBe("arg");
    });
  });

  describe("getTrackingGUID", () => {
    it("should return null for fiber without memoizedState", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const fiber = {};
      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should return null for fiber with null memoizedState", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const fiber = { memoizedState: null };
      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should return null when no hooks contain tracked GUIDs", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const fiber = {
        memoizedState: {
          memoizedState: { current: "not-a-tracked-guid" },
          next: {
            memoizedState: { current: "another-untracked-value" },
            next: null,
          },
        },
      };

      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should return GUID when found in hook chain and tracked in registry", async () => {
      const { useAutoTrace, getTrackingGUID, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      // First, create a tracked GUID
      renderHook(() => {
        return useAutoTrace();
      });

      const trackedGuids = getTrackedGUIDs();
      const trackedGuid = Array.from(trackedGuids)[0];

      // Create a fiber with the tracked GUID in its hook chain
      const fiber = {
        memoizedState: {
          memoizedState: { current: "unrelated-ref" },
          next: {
            memoizedState: { current: trackedGuid },
            next: {
              memoizedState: { current: "another-ref" },
              next: null,
            },
          },
        },
      };

      const result = getTrackingGUID(fiber);

      expect(result).toBe(trackedGuid);
    });

    it("should return null for GUID with correct format but not in registry", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const unregisteredGuid = "render-track-999-1234567890";
      const fiber = {
        memoizedState: {
          memoizedState: { current: unregisteredGuid },
          next: null,
        },
      };

      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should handle hooks with non-object memoizedState", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const fiber = {
        memoizedState: {
          memoizedState: "string-state",
          next: {
            memoizedState: 42,
            next: {
              memoizedState: true,
              next: null,
            },
          },
        },
      };

      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should handle hooks with object but no current property", async () => {
      const { getTrackingGUID } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const fiber = {
        memoizedState: {
          memoizedState: { value: "not-current" },
          next: {
            memoizedState: { current: null },
            next: {
              memoizedState: { current: 123 },
              next: null,
            },
          },
        },
      };

      const result = getTrackingGUID(fiber);

      expect(result).toBe(null);
    });

    it("should handle complex hook chain with multiple tracked GUIDs", async () => {
      const { useAutoTrace, getTrackingGUID, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      // Create multiple tracked GUIDs
      renderHook(() => {
        return useAutoTrace();
      });
      renderHook(() => {
        return useAutoTrace();
      });

      const trackedGuids = Array.from(getTrackedGUIDs());
      const [firstGuid, secondGuid] = trackedGuids;

      // Create fiber with the first GUID in the chain
      const fiber = {
        memoizedState: {
          memoizedState: { current: "unrelated" },
          next: {
            memoizedState: { current: firstGuid },
            next: {
              memoizedState: { current: secondGuid },
              next: null,
            },
          },
        },
      };

      const result = getTrackingGUID(fiber);

      // Should return the first matching GUID found
      expect(result).toBe(firstGuid);
    });
  });

  describe("clearRenderRegistry", () => {
    it("should clear tracked GUIDs", async () => {
      const { useAutoTrace, clearRenderRegistry, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      // Add some tracked GUIDs
      renderHook(() => {
        return useAutoTrace();
      });
      renderHook(() => {
        return useAutoTrace();
      });

      expect(getTrackedGUIDs().size).toBe(2);

      clearRenderRegistry();

      expect(getTrackedGUIDs().size).toBe(0);
    });

    it("should call componentLogRegistry.clear", async () => {
      const { componentLogRegistry } = vi.mocked(
        await import("@src/lib/features/autoTracer/functions/componentLogRegistry.js")
      );
      const { clearRenderRegistry } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

  // Reset mock to make this assertion robust and local to this test
  const mockedClear = vi.mocked(componentLogRegistry.clear);
  mockedClear.mockClear();
  clearRenderRegistry();

  expect(componentLogRegistry.clear).toHaveBeenCalledTimes(1);
    });

    it("should allow new registrations after clearing", async () => {
      const { useAutoTrace, clearRenderRegistry, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      // Add and clear
      renderHook(() => {
        return useAutoTrace();
      });
      clearRenderRegistry();

      // Add new ones
      renderHook(() => {
        return useAutoTrace();
      });

      expect(getTrackedGUIDs().size).toBe(1);
    });
  });

  describe("getTrackedGUIDs", () => {
    it("should return empty set initially", async () => {
      const { getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      const guids = getTrackedGUIDs();

      expect(guids).toBeInstanceOf(Set);
      expect(guids.size).toBe(0);
    });

    it("should return copy of tracked GUIDs", async () => {
      const { useAutoTrace, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      renderHook(() => {
        return useAutoTrace();
      });

      const guids1 = getTrackedGUIDs();
      const guids2 = getTrackedGUIDs();

      expect(guids1).not.toBe(guids2); // Different instances
      expect(guids1.size).toBe(guids2.size);
      expect(Array.from(guids1)[0]).toBe(Array.from(guids2)[0]); // Same content
    });

    it("should not affect internal state when modified", async () => {
      const { useAutoTrace, getTrackedGUIDs } = await import("@src/lib/features/autoTracer/functions/renderRegistry.js");

      renderHook(() => {
        return useAutoTrace();
      });

      const guids = getTrackedGUIDs();
      const originalSize = guids.size;

      // Modify the returned set
      guids.clear();
      guids.add("fake-guid");

      // Internal state should be unchanged
      const newGuids = getTrackedGUIDs();
      expect(newGuids.size).toBe(originalSize);
      expect(Array.from(newGuids)[0]).toMatch(/^render-track-\d+-\d+$/);
    });
  });
});
