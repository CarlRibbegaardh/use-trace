import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTrace } from "../../../src/lib/hooks/useTrace.js";

describe("useTrace", () => {
  describe("rendering stability", () => {
    it("should maintain same reference when scope name and object are unchanged", () => {
      const hook = renderHook(
        (scopeName) => {
          return useTrace(scopeName.x, scopeName.y);
        },
        {
          initialProps: { x: "a", y: { a: "a" } },
        }
      );

      const a = hook.result.current;

      hook.rerender({ x: "a", y: { a: "b" } });

      const b = hook.result.current;
      expect(a).toBe(b);

      hook.rerender({ x: "b", y: { a: "a" } });

      const c = hook.result.current;
      expect(a).not.toBe(c);
    });
  });

  describe("enabled/disabled functionality", () => {
    it("should return active functions when enabled is true", () => {
      const { result } = renderHook(() => {
        return useTrace("TestScope", {}, true);
      });

      expect(typeof result.current.log).toBe("function");
      expect(typeof result.current.exit).toBe("function");
      expect(typeof result.current.state).toBe("function");
    });

    it("should return active functions when enabled is undefined (default)", () => {
      const { result } = renderHook(() => {
        return useTrace("TestScope", {});
      });

      expect(typeof result.current.log).toBe("function");
      expect(typeof result.current.exit).toBe("function");
      expect(typeof result.current.state).toBe("function");
    });

    it("should return noop functions when enabled is false", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { result } = renderHook(() => {
        return useTrace("TestScope", {}, false);
      });

      // Functions should exist but be no-ops
      result.current.log("test");
      result.current.exit("test");
      result.current.state({ test: "value" });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("tracing behavior", () => {
    it("should call traceEnter when active", () => {
      const consoleSpy = vi.spyOn(console, "group").mockImplementation(() => {});

      renderHook(() => {
        return useTrace("TestScope", { prop: "value" });
      });

      expect(consoleSpy).toHaveBeenCalledWith("TestScope");

      consoleSpy.mockRestore();
    });

    it("should not call traceEnter when disabled", () => {
      const consoleSpy = vi.spyOn(console, "group").mockImplementation(() => {});

      renderHook(() => {
        return useTrace("TestScope", { prop: "value" }, false);
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should track prop changes when scope object is provided", () => {
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const hook = renderHook(
        (props) => {
          return useTrace("TestScope", props);
        },
        { initialProps: { prop1: "value1", prop2: "value2" } }
      );

      // Initial render should log initial values
      expect(consoleLogSpy).toHaveBeenCalledWith("[TestScope] Initial render");

      // Rerender with changed props
      hook.rerender({ prop1: "newValue1", prop2: "value2" });

      // Should detect the change
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Previous prop: prop1 =",
        "value1"
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Current prop: prop1 =",
        "newValue1"
      );

      consoleInfoSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("returned functions", () => {
    it("should return working log function", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { result } = renderHook(() => {
        return useTrace("TestScope");
      });

      result.current.log("Test message", { data: "test" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[TestScope]%c Test message",
        "font-weight: bold",
        { data: "test" }
      );

      consoleSpy.mockRestore();
    });

    it("should return working exit function", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useTrace("TestScope");
      });

      result.current.exit("Exit message");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[TestScope]%c Exit message",
        "font-weight: bold"
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it("should return working state function", () => {
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const { result } = renderHook(() => {
        return useTrace("TestScope");
      });

      result.current.state({ stateVar: "value" });

      expect(consoleLogSpy).toHaveBeenCalledWith("[TestScope] Initial render");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[TestScope] Initial state: stateVar =",
        "value"
      );

      consoleInfoSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("memoization", () => {
    it("should memoize result based on active state and scopeName", () => {
      const hook = renderHook(
        ({ enabled, scope }) => {
          return useTrace(scope, {}, enabled);
        },
        { initialProps: { enabled: true, scope: "TestScope" } }
      );

      const result1 = hook.result.current;

      // Same props should return same reference
      hook.rerender({ enabled: true, scope: "TestScope" });
      const result2 = hook.result.current;
      expect(result1).toBe(result2);

      // Different enabled state should return different reference
      hook.rerender({ enabled: false, scope: "TestScope" });
      const result3 = hook.result.current;
      expect(result1).not.toBe(result3);

      // Different scope name should return different reference
      hook.rerender({ enabled: true, scope: "NewScope" });
      const result4 = hook.result.current;
      expect(result1).not.toBe(result4);
    });
  });
});
