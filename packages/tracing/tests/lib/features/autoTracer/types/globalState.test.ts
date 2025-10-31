import { describe, expect, it, vi } from "vitest";
import {
  isDarkMode,
  isGlobalTracerInstalled,
  renderStartTime,
  setIsGlobalTracerInstalled,
  setRenderStartTime,
  setTracerOptions,
  traceOptions
  } from "@src/lib/features/autoTracer/types/globalState.js";// Mock window.matchMedia for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

describe("globalState", () => {
  describe("isDarkMode", () => {
    it("should return false when matchMedia returns false", () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        return {
          matches: false
        };
      });

      expect(isDarkMode()).toBe(false);
    });

    it("should return true when matchMedia returns true", () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        return {
          matches: true
        };
      });

      expect(isDarkMode()).toBe(true);
    });

    it("should handle matchMedia errors gracefully", () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error("matchMedia error");
      });

      expect(isDarkMode()).toBe(false);
    });
  });

  describe("global state management", () => {
    it("should have initial values", () => {
      expect(typeof isGlobalTracerInstalled).toBe("boolean");
      expect(typeof renderStartTime).toBe("number");
      expect(typeof traceOptions).toBe("object");
    });

    it("should allow setting global tracer installed state", () => {
      setIsGlobalTracerInstalled(true);
      expect(isGlobalTracerInstalled).toBe(true);

      setIsGlobalTracerInstalled(false);
      expect(isGlobalTracerInstalled).toBe(false);
    });

    it("should allow setting render start time", () => {
      const testTime = 12345;
      setRenderStartTime(testTime);
      expect(renderStartTime).toBe(testTime);
    });

    it("should merge trace options", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const newOptions = {
        enabled: false,
        enableAutoTracerInternalsLogging: true
      };

      setTracerOptions(newOptions);

      expect(traceOptions.enabled).toBe(false);
      expect(traceOptions.enableAutoTracerInternalsLogging).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should not log when enableAutoTracerInternalsLogging is false", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const newOptions = {
        enabled: true,
        enableAutoTracerInternalsLogging: false
      };

      setTracerOptions(newOptions);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
