import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useObjectChangeTracker } from "../../../src/lib/hooks/useObjectChangeTracker.js";

describe("useObjectChangeTracker", () => {
  describe("initialization", () => {
    it("should return an object with compare function", () => {
      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      expect(typeof result.current.compare).toBe("function");
    });

    it("should handle different scope names and object types", () => {
      const { result: result1 } = renderHook(() => {
        return useObjectChangeTracker("Scope1", "prop");
      });
      const { result: result2 } = renderHook(() => {
        return useObjectChangeTracker("Scope2", "state");
      });

      expect(typeof result1.current.compare).toBe("function");
      expect(typeof result2.current.compare).toBe("function");
      expect(result1.current.compare).not.toBe(result2.current.compare);
    });
  });

  describe("compare function behavior", () => {
    it("should handle undefined scope object", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      result.current.compare(undefined);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log initial render for first object", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      result.current.compare({ prop1: "value1", prop2: "value2" });

      expect(consoleLogSpy).toHaveBeenCalledWith("[TestScope] Initial render");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Initial prop: prop1 =",
        "value1"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Initial prop: prop2 =",
        "value2"
      );

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should detect changes in object properties", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      // First call
      result.current.compare({ prop1: "value1", prop2: "value2" });

      // Clear mock calls from initial render
      consoleLogSpy.mockClear();
      consoleInfoSpy.mockClear();

      // Second call with changed property
      result.current.compare({ prop1: "newValue1", prop2: "value2" });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Previous prop: prop1 =",
        "value1"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Current prop: prop1 =",
        "newValue1"
      );

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should not log when no changes detected", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      const obj = { prop1: "value1", prop2: "value2" };

      // First call
      result.current.compare(obj);

      // Clear mock calls from initial render
      consoleLogSpy.mockClear();
      consoleInfoSpy.mockClear();

      // Second call with same object
      result.current.compare(obj);

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should handle objects with different number of properties", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "prop");
      });

      // First call
      result.current.compare({ prop1: "value1" });

      // Clear mock calls from initial render
      consoleLogSpy.mockClear();
      consoleInfoSpy.mockClear();

      // Second call with more properties
      result.current.compare({ prop1: "value1", prop2: "value2" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[TestScope] The current object has a different number of items compared to last render. (Usually unexpected.)"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Previous prop: ",
        { prop1: "value1" }
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Current prop: ",
        { prop1: "value1", prop2: "value2" }
      );

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should detect multiple property changes", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "state");
      });

      // First call
      result.current.compare({ state1: "value1", state2: "value2", state3: "value3" });

      // Clear mock calls from initial render
      consoleLogSpy.mockClear();
      consoleInfoSpy.mockClear();

      // Second call with multiple changes
      result.current.compare({ state1: "newValue1", state2: "value2", state3: "newValue3" });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Previous state: state1 =",
        "value1"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Current state: state1 =",
        "newValue1"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Previous state: state3 =",
        "value3"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Current state: state3 =",
        "newValue3"
      );

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should use correct object type in log messages", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useObjectChangeTracker("TestScope", "customType");
      });

      result.current.compare({ prop: "value" });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Initial customType: prop =",
        "value"
      );

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe("memoization", () => {
    it("should maintain same compare function reference across renders", () => {
      const hook = renderHook(
        ({ scope, type }) => {
          return useObjectChangeTracker(scope, type);
        },
        { initialProps: { scope: "TestScope", type: "prop" } }
      );

      const compare1 = hook.result.current.compare;

      // Rerender with same props
      hook.rerender({ scope: "TestScope", type: "prop" });
      const compare2 = hook.result.current.compare;

      expect(compare1).toBe(compare2);
    });

    it("should create new compare function when dependencies change", () => {
      const hook = renderHook(
        ({ scope, type }) => {
          return useObjectChangeTracker(scope, type);
        },
        { initialProps: { scope: "TestScope", type: "prop" } }
      );

      const compare1 = hook.result.current.compare;

      // Rerender with different scope
      hook.rerender({ scope: "NewScope", type: "prop" });
      const compare2 = hook.result.current.compare;

      expect(compare1).not.toBe(compare2);

      // Rerender with different type
      hook.rerender({ scope: "NewScope", type: "state" });
      const compare3 = hook.result.current.compare;

      expect(compare2).not.toBe(compare3);
    });
  });
});
