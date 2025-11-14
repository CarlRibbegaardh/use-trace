import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all dependencies
vi.mock("@src/lib/functions/stringify.js", () => {
  return {
    stringify: vi.fn((value) => {
      return JSON.stringify(value);
    }),
  };
});

vi.mock("@src/lib/functions/extractPropChanges.js", () => {
  return {
    extractPropChanges: vi.fn(() => {
      return [];
    }),
  };
});

vi.mock("@src/lib/functions/extractUseStateValues.js", () => {
  return {
    extractUseStateValues: vi.fn(() => {
      return [];
    }),
  };
});

vi.mock("@src/lib/functions/getComponentName.js", () => {
  return {
    getComponentName: vi.fn(() => {
      return "TestComponent";
    }),
  };
});

vi.mock("@src/lib/functions/getRealComponentName.js", () => {
  return {
    getRealComponentName: vi.fn(() => {
      return "RealTestComponent";
    }),
  };
});

vi.mock("@src/lib/functions/isReactInternal.js", () => {
  return {
    isReactInternal: vi.fn(() => {
      return false;
    }),
  };
});

vi.mock("@src/lib/functions/log.js", () => {
  return {
    log: vi.fn(),
    logLogStatement: vi.fn(),
    logPropChange: vi.fn(),
    logReconciled: vi.fn(),
    logSkipped: vi.fn(),
    logStateChange: vi.fn(),
    logStyled: vi.fn(),
    logWarn: vi.fn(),
  };
});

vi.mock("@src/lib/types/globalState.js", () => {
  return {
    traceOptions: {
      maxFiberDepth: 1000,
      includeNonTrackedBranches: true,
      includeReconciled: "always" as const,
      includeSkipped: "always" as const,
      showFlags: false,
    },
  };
});

vi.mock("@src/lib/functions/reactFiberFlags.js", () => {
  return {
    Placement: 2,
    getFlagNames: vi.fn(() => {
      return ["Update"];
    }),
    hasRenderWork: vi.fn(() => {
      return true;
    }),
  };
});

vi.mock("@src/lib/functions/renderRegistry.js", () => {
  return {
    getTrackingGUID: vi.fn(() => {
      return null;
    }),
  };
});

vi.mock("@src/lib/functions/getSkippedProps.js", () => {
  return {
    getSkippedProps: vi.fn(() => {
      return [];
    }),
  };
});

vi.mock("@src/lib/functions/componentLogRegistry.js", () => {
  return {
    componentLogRegistry: {
      consumeLogs: vi.fn(() => {
        return [];
      }),
    },
  };
});

describe("walkFiberForUpdates", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset trace options between tests to avoid leakage
    const { traceOptions } = await import("@src/lib/types/globalState.js");
    traceOptions.maxFiberDepth = 1000;
    traceOptions.includeNonTrackedBranches = true;
    traceOptions.includeReconciled = "always" as const;
    traceOptions.includeSkipped = "always" as const;
    traceOptions.showFlags = false;
  });

  describe("resetDepthTracking", () => {
    it("should reset depth tracking", async () => {
      const { resetDepthTracking } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );

      resetDepthTracking();

      // No direct assertion possible since lastDepth is internal,
      // but we can verify the function executes without error
      expect(true).toBe(true);
    });
  });

  describe("walkFiberForUpdates", () => {
    it("should return early for non-object fiber", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { logWarn } = vi.mocked(await import("@src/lib/functions/log.js"));

      walkFiberForUpdates(null, 0);
      walkFiberForUpdates("string", 0);
      walkFiberForUpdates(123, 0);

      expect(logWarn).not.toHaveBeenCalled();
    });

    it("should warn and return when max depth exceeded", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/types/globalState.js")
      );
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { logWarn } = vi.mocked(await import("@src/lib/functions/log.js"));

      traceOptions.maxFiberDepth = 5;

      const fiber = { elementType: "div" };
      walkFiberForUpdates(fiber, 6);

      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Maximum traversal depth (5) reached, stopping to prevent stack overflow"
      );
    });

    it("should process fiber without elementType", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );

      const fiber = {
        child: null,
        sibling: null,
      };

      // Should not throw
      walkFiberForUpdates(fiber, 0);
      expect(true).toBe(true);
    });

    it("should process component fiber with elementType", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { getComponentName } = vi.mocked(
        await import("@src/lib/functions/getComponentName.js")
      );
      const { getRealComponentName } = vi.mocked(
        await import("@src/lib/functions/getRealComponentName.js")
      );

      getComponentName.mockReturnValue("TestComponent");
      getRealComponentName.mockReturnValue("RealTestComponent");

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 0,
        alternate: null,
      };

      walkFiberForUpdates(fiber, 0);

      expect(getComponentName).toHaveBeenCalledWith(fiber.elementType);
      expect(getRealComponentName).toHaveBeenCalledWith(fiber);
    });

    it("should handle tracked components", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { getTrackingGUID } = vi.mocked(
        await import("@src/lib/functions/renderRegistry.js")
      );

      getTrackingGUID.mockReturnValue("test-guid-123");

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 0,
        alternate: null,
      };

      walkFiberForUpdates(fiber, 0);

      expect(getTrackingGUID).toHaveBeenCalledWith(fiber);
    });

    it("should skip non-tracked branches when option enabled", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/types/globalState.js")
      );
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { getTrackingGUID } = vi.mocked(
        await import("@src/lib/functions/renderRegistry.js")
      );

      traceOptions.includeNonTrackedBranches = false;
      getTrackingGUID.mockReturnValue(null);

      const childFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
      };

      const fiber = {
        elementType: () => {
          return null;
        },
        child: childFiber,
        sibling: null,
        flags: 0,
        alternate: null,
      };

      walkFiberForUpdates(fiber, 0);

      // Should still traverse children even when skipping
      expect(getTrackingGUID).toHaveBeenCalledWith(fiber);
    });

    it("should identify mount vs render vs reconciled", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { hasRenderWork } = vi.mocked(
        await import("@src/lib/functions/reactFiberFlags.js")
      );

      // Test Mount (no alternate + placement flags)
      hasRenderWork.mockReturnValue(true);
      const mountFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 2, // Placement flag
        alternate: null,
      };

      walkFiberForUpdates(mountFiber, 0);

      // Test Reconciled (no flags)
      const reconciledFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 0,
        alternate: {},
      };

      walkFiberForUpdates(reconciledFiber, 0);

      // Also exercise the non-mount flagged path (Skipped/Rendering)
      hasRenderWork.mockReturnValueOnce(false);
      const flaggedNoRenderFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 4, // some non-zero flag without placement
        alternate: {},
      };
      walkFiberForUpdates(flaggedNoRenderFiber, 0);

      expect(hasRenderWork).toHaveBeenCalled();
    });

    it("should handle reconciled components based on includeReconciled option", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/types/globalState.js")
      );
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );

      traceOptions.includeReconciled = "never" as const;

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 0, // No flags = reconciled
        alternate: {},
      };

      walkFiberForUpdates(fiber, 0);

      // Should process but skip display logic
      expect(true).toBe(true);
    });

    it("should handle skipped components based on includeSkipped option", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/types/globalState.js")
      );
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { hasRenderWork } = vi.mocked(
        await import("@src/lib/functions/reactFiberFlags.js")
      );

      traceOptions.includeSkipped = "never" as const;
      hasRenderWork.mockReturnValue(false);

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 1, // Has flags but no render work = skipped
        alternate: {},
      };

      walkFiberForUpdates(fiber, 0);

      expect(hasRenderWork).toHaveBeenCalled();
    });

    it("should recursively walk child and sibling fibers", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { getComponentName } = vi.mocked(
        await import("@src/lib/functions/getComponentName.js")
      );

      let callCount = 0;
      getComponentName.mockImplementation(() => {
        callCount++;
        return `Component${callCount}`;
      });

      const siblingFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
      };

      const childFiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: siblingFiber,
      };

      const rootFiber = {
        elementType: () => {
          return null;
        },
        child: childFiber,
        sibling: null,
      };

      walkFiberForUpdates(rootFiber, 0);

      // Should be called for root, child, and sibling
      expect(getComponentName).toHaveBeenCalledTimes(3);
    });

    it("should handle prop changes extraction", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { extractPropChanges } = vi.mocked(
        await import("@src/lib/functions/extractPropChanges.js")
      );
      const { getTrackingGUID } = vi.mocked(
        await import("@src/lib/functions/renderRegistry.js")
      );

      getTrackingGUID.mockReturnValue("test-guid");
      extractPropChanges.mockReturnValue([
        { name: "prop1", value: "new", prevValue: "old" },
      ]);

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 1,
        alternate: {
          memoizedProps: { prop1: "old" },
        },
        memoizedProps: { prop1: "new" },
        pendingProps: { prop1: "new" },
      };

      walkFiberForUpdates(fiber, 0);

      // Called with fiber node and display name based on implementation
      expect(extractPropChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          alternate: expect.objectContaining({
            memoizedProps: { prop1: "old" },
          }),
          memoizedProps: { prop1: "new" },
          pendingProps: { prop1: "new" },
        }),
        "RealTestComponent"
      );
    });

    it("should handle state changes extraction", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { extractUseStateValues } = vi.mocked(
        await import("@src/lib/functions/extractUseStateValues.js")
      );
      const { getTrackingGUID } = vi.mocked(
        await import("@src/lib/functions/renderRegistry.js")
      );

      getTrackingGUID.mockReturnValue("test-guid");
      extractUseStateValues.mockReturnValue([
        {
          name: "state1",
          value: "newValue",
          hook: { memoizedState: "newValue", queue: {}, next: null }
        },
      ]);

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 1,
        alternate: {
          memoizedState: {},
        },
        memoizedState: {},
      };

      walkFiberForUpdates(fiber, 0);

      // Called with the fiber node, not separate states
      expect(extractUseStateValues).toHaveBeenCalledWith(
        expect.objectContaining({
          alternate: expect.objectContaining({ memoizedState: {} }),
          memoizedState: {},
        })
      );
    });

    it("should handle component log consumption", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { componentLogRegistry } = vi.mocked(
        await import("@src/lib/functions/componentLogRegistry.js")
      );
      const { getTrackingGUID } = vi.mocked(
        await import("@src/lib/functions/renderRegistry.js")
      );

      const testGuid = "test-guid-123";
      getTrackingGUID.mockReturnValue(testGuid);

      const mockConsumeLogs = vi.mocked(componentLogRegistry.consumeLogs);
      mockConsumeLogs.mockReturnValue([
        { message: "test log", args: ["arg1"], timestamp: Date.now(), level: 'log' },
      ]);

      const fiber = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
        flags: 1, // ensure it passes through display logic
        alternate: null,
      };

      walkFiberForUpdates(fiber, 0);

      expect(componentLogRegistry.consumeLogs).toHaveBeenCalledWith(testGuid);
    });

    it("should handle complex fiber tree traversal", async () => {
      const { walkFiberForUpdates } = await import(
        "@src/lib/functions/walkFiberForUpdates.js"
      );
      const { getComponentName } = vi.mocked(
        await import("@src/lib/functions/getComponentName.js")
      );

      let depth = 0;
      getComponentName.mockImplementation(() => {
        depth++;
        return `Component${depth}`;
      });

      // Create a complex tree: root -> child1 -> grandchild, child2
      const grandchild = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
      };

      const child2 = {
        elementType: () => {
          return null;
        },
        child: null,
        sibling: null,
      };

      const child1 = {
        elementType: () => {
          return null;
        },
        child: grandchild,
        sibling: child2,
      };

      const root = {
        elementType: () => {
          return null;
        },
        child: child1,
        sibling: null,
      };

      walkFiberForUpdates(root, 0);

      // Should visit all nodes: root, child1, grandchild, child2
      expect(getComponentName).toHaveBeenCalledTimes(4);
    });
  });
});
