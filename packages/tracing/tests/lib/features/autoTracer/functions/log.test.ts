import { describe, expect, it, vi } from "vitest";
import { log, logWarn } from "@src/lib/features/autoTracer/functions/log.js";

// Mock global state for theme detection
vi.mock("@src/lib/features/autoTracer/types/globalState.js", () => {
  return {
    isDarkMode: vi.fn(() => {
      return false;
    }),
    traceOptions: {
      colors: {
        definitiveRender: {
          lightMode: { text: "#0044ff", bold: true },
          darkMode: { text: "#4fd6ff", bold: true }
        }
      }
    }
  };
});

describe("log functions", () => {
  describe("log", () => {
    it("should call console.log with arguments", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      log("test", "message", { data: "value" });

      expect(consoleSpy).toHaveBeenCalledWith("test", "message", { data: "value" });

      consoleSpy.mockRestore();
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.console = undefined;

      expect(() => {
        log("test message");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.log throwing error", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        log("test message");
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("logWarn", () => {
    it("should call console.warn with arguments", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      logWarn("warning", "message");

      expect(consoleSpy).toHaveBeenCalledWith("warning", "message");

      consoleSpy.mockRestore();
    });

    it("should handle console.warn being undefined", () => {
      const originalWarn = console.warn;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.warn = undefined;

      expect(() => {
        logWarn("warning message");
      }).not.toThrow();

      console.warn = originalWarn;
    });

    it("should handle console.warn throwing error", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        throw new Error("Console warn error");
      });

      expect(() => {
        logWarn("warning message");
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
