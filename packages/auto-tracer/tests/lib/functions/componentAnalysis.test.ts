import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ComponentAnalysis,
  analyzeComponentFiber,
  determineRenderType,
  getComponentDisplayInfo,
  isComponentFiber,
  shouldTrackComponent,
} from "@src/lib/functions/componentAnalysis.js";

// Mock dependencies
vi.mock("@src/lib/functions/getComponentName.js", () => {
  return {
    getComponentName: vi.fn(),
  };
});

vi.mock("@src/lib/functions/getRealComponentName.js", () => {
  return {
    getRealComponentName: vi.fn(),
  };
});

vi.mock("@src/lib/functions/renderRegistry.js", () => {
  return {
    getTrackingGUID: vi.fn(),
  };
});

vi.mock("@src/lib/functions/reactFiberFlags.js", () => {
  return {
    Placement: 2,
    hasRenderWork: vi.fn(),
  };
});

describe("componentAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isComponentFiber", () => {
    it("should return false for non-object fiber", () => {
      expect(isComponentFiber(null)).toBe(false);
      expect(isComponentFiber(undefined)).toBe(false);
      expect(isComponentFiber("string")).toBe(false);
      expect(isComponentFiber(123)).toBe(false);
    });

    it("should return false for object without elementType", () => {
      const fiber = { child: null, sibling: null };
      expect(isComponentFiber(fiber)).toBe(false);
    });

    it("should return true for object with elementType", () => {
      const fiber = { elementType: () => {}, child: null, sibling: null };
      expect(isComponentFiber(fiber)).toBe(true);
    });
  });

  describe("determineRenderType", () => {
    it("should return Mount for new mount with placement flags", async () => {
      const { Placement } = await import("@src/lib/functions/reactFiberFlags.js");

      const fiberNode = {
        flags: Placement,
        alternate: null, // no alternate = new mount
        elementType: () => {},
      };

      const result = determineRenderType(fiberNode);
      expect(result).toBe("Mount");
    });

    it("should return Reconciled for fiber with no flags", () => {
      const fiberNode = {
        flags: 0,
        alternate: { memoizedProps: {} }, // has alternate
        elementType: () => {},
      };

      const result = determineRenderType(fiberNode);
      expect(result).toBe("Reconciled");
    });

    it("should return Rendering when component has render work", async () => {
      const { hasRenderWork } = await import("@src/lib/functions/reactFiberFlags.js");
      vi.mocked(hasRenderWork).mockReturnValue(true);

      const fiberNode = {
        flags: 4, // some flags but not placement
        alternate: { memoizedProps: {} },
        elementType: () => {},
      };

      const result = determineRenderType(fiberNode);
      expect(result).toBe("Rendering");
    });

    it("should return Skipped when component has flags but no render work", async () => {
      const { hasRenderWork } = await import("@src/lib/functions/reactFiberFlags.js");
      vi.mocked(hasRenderWork).mockReturnValue(false);

      const fiberNode = {
        flags: 4, // some flags but not placement
        alternate: { memoizedProps: {} },
        elementType: () => {},
      };

      const result = determineRenderType(fiberNode);
      expect(result).toBe("Skipped");
    });

    it("should handle fiber with undefined flags", () => {
      const fiberNode = {
        flags: undefined,
        alternate: { memoizedProps: {} },
        elementType: () => {},
      };

      const result = determineRenderType(fiberNode);
      expect(result).toBe("Reconciled");
    });
  });

  describe("analyzeComponentFiber", () => {
    it("should return null for non-object fiber", () => {
      expect(analyzeComponentFiber(null)).toBeNull();
      expect(analyzeComponentFiber("string")).toBeNull();
    });

    it("should return null for non-component fiber", () => {
      const fiber = { child: null, sibling: null }; // no elementType
      expect(analyzeComponentFiber(fiber)).toBeNull();
    });

    it("should analyze component fiber completely", async () => {
      const { getComponentName } = await import("@src/lib/functions/getComponentName.js");
      const { getRealComponentName } = await import("@src/lib/functions/getRealComponentName.js");
      const { getTrackingGUID } = await import("@src/lib/functions/renderRegistry.js");
      const { hasRenderWork } = await import("@src/lib/functions/reactFiberFlags.js");

      vi.mocked(getComponentName).mockReturnValue("TestComponent");
      vi.mocked(getRealComponentName).mockReturnValue("RealTestComponent");
      vi.mocked(getTrackingGUID).mockReturnValue("test-guid");
      vi.mocked(hasRenderWork).mockReturnValue(true);

      const fiber = {
        elementType: () => {},
        flags: 4,
        alternate: { memoizedProps: {} },
        child: null,
        sibling: null,
      };

      const result = analyzeComponentFiber(fiber);

      expect(result).toEqual({
        componentName: "TestComponent",
        realComponentName: "RealTestComponent",
        displayName: "RealTestComponent",
        trackingGUID: "test-guid",
        isTracked: true,
        renderType: "Rendering",
        flags: 4,
        isMount: false,
      });
    });

    it("should use componentName when realComponentName is Unknown", async () => {
      const { getComponentName } = await import("@src/lib/functions/getComponentName.js");
      const { getRealComponentName } = await import("@src/lib/functions/getRealComponentName.js");
      const { getTrackingGUID } = await import("@src/lib/functions/renderRegistry.js");

      vi.mocked(getComponentName).mockReturnValue("TestComponent");
      vi.mocked(getRealComponentName).mockReturnValue("Unknown");
      vi.mocked(getTrackingGUID).mockReturnValue(null);

      const fiber = {
        elementType: () => {},
        flags: 0,
        alternate: { memoizedProps: {} },
        child: null,
        sibling: null,
      };

      const result = analyzeComponentFiber(fiber);

      expect(result?.displayName).toBe("TestComponent");
      expect(result?.isTracked).toBe(false);
    });
  });

  describe("shouldTrackComponent", () => {
    it("should return false for null analysis", () => {
      expect(shouldTrackComponent(null, 0)).toBe(false);
    });

    it("should return true for tracked components", () => {
      const analysis: ComponentAnalysis = {
        componentName: "Test",
        realComponentName: "Test",
        displayName: "Test",
        trackingGUID: "guid",
        isTracked: true,
        renderType: "Rendering",
        flags: 0,
        isMount: false,
      };

      expect(shouldTrackComponent(analysis, 0)).toBe(true);
    });

    it("should return true for non-tracked components (default behavior)", () => {
      const analysis: ComponentAnalysis = {
        componentName: "Test",
        realComponentName: "Test",
        displayName: "Test",
        trackingGUID: null,
        isTracked: false,
        renderType: "Rendering",
        flags: 0,
        isMount: false,
      };

      expect(shouldTrackComponent(analysis, 0)).toBe(true);
    });
  });

  describe("getComponentDisplayInfo", () => {
    it("should extract display information from analysis", () => {
      const analysis: ComponentAnalysis = {
        componentName: "Test",
        realComponentName: "Test",
        displayName: "TestComponent",
        trackingGUID: "guid",
        isTracked: true,
        renderType: "Mount",
        flags: 2,
        isMount: true,
      };

      const result = getComponentDisplayInfo(analysis);

      expect(result).toEqual({
        displayName: "TestComponent",
        isTracked: true,
        renderType: "Mount",
        flags: 2,
        hasFlags: true,
      });
    });

    it("should handle zero flags correctly", () => {
      const analysis: ComponentAnalysis = {
        componentName: "Test",
        realComponentName: "Test",
        displayName: "TestComponent",
        trackingGUID: null,
        isTracked: false,
        renderType: "Reconciled",
        flags: 0,
        isMount: false,
      };

      const result = getComponentDisplayInfo(analysis);

      expect(result.hasFlags).toBe(false);
    });
  });
});
