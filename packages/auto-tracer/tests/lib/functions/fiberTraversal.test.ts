import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type FiberVisitor,
  getLastDepth,
  isInParentChainOfTracked,
  resetDepthTracking,
  setLastDepth,
  shouldSkipFiber,
  walkFiberTree,
} from "@src/lib/functions/fiberTraversal.js";

// Mock dependencies
vi.mock("@src/lib/types/globalState.js", () => {
  return {
    traceOptions: {
      maxFiberDepth: 1000,
      skipNonTrackedBranches: false,
    },
  };
});

vi.mock("@src/lib/functions/log.js", () => {
  return {
    logWarn: vi.fn(),
  };
});

vi.mock("@src/lib/functions/renderRegistry.js", () => {
  return {
    getTrackingGUID: vi.fn(),
  };
});

describe("fiberTraversal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDepthTracking();
  });

  describe("depth tracking", () => {
    it("should reset depth tracking", () => {
      setLastDepth(5);
      expect(getLastDepth()).toBe(5);

      resetDepthTracking();
      expect(getLastDepth()).toBe(-1);
    });

    it("should get and set last depth", () => {
      expect(getLastDepth()).toBe(-1);

      setLastDepth(3);
      expect(getLastDepth()).toBe(3);
    });
  });

  describe("isInParentChainOfTracked", () => {
    it("should return false for non-object fiber", () => {
      const result = isInParentChainOfTracked(null, 0);
      expect(result).toBe(false);
    });

    it("should return true when fiber has tracked descendant", async () => {
      const { getTrackingGUID } = await import("@src/lib/functions/renderRegistry.js");
      vi.mocked(getTrackingGUID).mockReturnValue("tracked-guid");

      const trackedChild = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const parentFiber = {
        elementType: null,
        child: trackedChild,
        sibling: null,
      };

      const result = isInParentChainOfTracked(parentFiber, 0);
      expect(result).toBe(true);
    });

    it("should return false when no tracked descendants", async () => {
      const { getTrackingGUID } = await import("@src/lib/functions/renderRegistry.js");
      vi.mocked(getTrackingGUID).mockReturnValue(null);

      const child = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const parentFiber = {
        elementType: null,
        child,
        sibling: null,
      };

      const result = isInParentChainOfTracked(parentFiber, 0);
      expect(result).toBe(false);
    });
  });

  describe("walkFiberTree", () => {
    it("should return early for non-object fiber", () => {
      const visitor: FiberVisitor = {
        visit: vi.fn().mockReturnValue(true),
      };

      walkFiberTree(null, 0, visitor);
      expect(visitor.visit).not.toHaveBeenCalled();
    });

    it("should warn and return when max depth exceeded", async () => {
      const { traceOptions } = await import("@src/lib/types/globalState.js");
      const { logWarn } = await import("@src/lib/functions/log.js");

      traceOptions.maxFiberDepth = 2;

      const visitor: FiberVisitor = {
        visit: vi.fn().mockReturnValue(true),
      };

      const fiber = { elementType: () => {} };

      walkFiberTree(fiber, 3, visitor);

      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Maximum traversal depth (2) reached, stopping to prevent stack overflow"
      );
      expect(visitor.visit).not.toHaveBeenCalled();
    });

    it("should call visitor for each fiber node", () => {
      const visitor: FiberVisitor = {
        visit: vi.fn().mockReturnValue(true),
      };

      const childFiber = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const siblingFiber = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const parentFiber = {
        elementType: () => {},
        child: childFiber,
        sibling: siblingFiber,
      };

      walkFiberTree(parentFiber, 0, visitor);

      expect(visitor.visit).toHaveBeenCalledTimes(3);
      expect(visitor.visit).toHaveBeenCalledWith(parentFiber, 0);
      expect(visitor.visit).toHaveBeenCalledWith(childFiber, 1);
      expect(visitor.visit).toHaveBeenCalledWith(siblingFiber, 0);
    });

    it("should stop traversal when visitor returns false", () => {
      const visitor: FiberVisitor = {
        visit: vi.fn().mockReturnValue(false),
      };

      const childFiber = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const parentFiber = {
        elementType: () => {},
        child: childFiber,
        sibling: null,
      };

      walkFiberTree(parentFiber, 0, visitor);

      expect(visitor.visit).toHaveBeenCalledTimes(1);
      expect(visitor.visit).toHaveBeenCalledWith(parentFiber, 0);
    });

    it("should handle deep fiber tree structures", () => {
      const visitor: FiberVisitor = {
        visit: vi.fn().mockReturnValue(true),
      };

      // Create a deep nested structure
      const deepChild = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const middleChild = {
        elementType: () => {},
        child: deepChild,
        sibling: null,
      };

      const parentFiber = {
        elementType: () => {},
        child: middleChild,
        sibling: null,
      };

      walkFiberTree(parentFiber, 0, visitor);

      expect(visitor.visit).toHaveBeenCalledTimes(3);
      expect(visitor.visit).toHaveBeenCalledWith(parentFiber, 0);
      expect(visitor.visit).toHaveBeenCalledWith(middleChild, 1);
      expect(visitor.visit).toHaveBeenCalledWith(deepChild, 2);
    });
  });

  describe("shouldSkipFiber", () => {
    it("should return false when skipNonTrackedBranches is disabled", async () => {
      const { traceOptions } = await import("@src/lib/types/globalState.js");
      traceOptions.skipNonTrackedBranches = false;

      const result = shouldSkipFiber({}, 0, false);
      expect(result).toBe(false);
    });

    it("should return false for tracked fibers", async () => {
      const { traceOptions } = await import("@src/lib/types/globalState.js");
      traceOptions.skipNonTrackedBranches = true;

      const result = shouldSkipFiber({}, 0, true);
      expect(result).toBe(false);
    });

    it("should return true for non-tracked fibers not in parent chain", async () => {
      const { traceOptions } = await import("@src/lib/types/globalState.js");
      const { getTrackingGUID } = await import("@src/lib/functions/renderRegistry.js");

      traceOptions.skipNonTrackedBranches = true;
      vi.mocked(getTrackingGUID).mockReturnValue(null);

      const fiber = {
        elementType: () => {},
        child: null,
        sibling: null,
      };

      const result = shouldSkipFiber(fiber, 0, false);
      expect(result).toBe(true);
    });
  });
});
