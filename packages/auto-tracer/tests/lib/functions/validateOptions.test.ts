import { describe, expect, it, vi } from "vitest";
import {
  validateAutoTracerOptions,
  validateMaxFiberDepth,
} from "@src/lib/functions/validateOptions.js";

// Mock log functions
vi.mock("@src/lib/functions/log.js", () => {
  return {
    logWarn: vi.fn(),
  };
});

describe("validateOptions", () => {
  describe("validateMaxFiberDepth", () => {
    it("should return default value (100) when depth is undefined", () => {
      expect(validateMaxFiberDepth(undefined)).toBe(100);
    });

    it("should return default value (100) when depth is null", () => {
      expect(validateMaxFiberDepth(null as unknown as number)).toBe(100);
    });

    it("should return default value (100) and warn when depth is not a number", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth("invalid" as unknown as number)).toBe(100);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Invalid maxFiberDepth, using default (100)"
      );
    });

    it("should return default value (100) and warn when depth is NaN", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(NaN)).toBe(100);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Invalid maxFiberDepth, using default (100)"
      );
    });

    it("should return minimum value (20) and warn when depth is too low", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(10)).toBe(20);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too low, using minimum (20)"
      );
    });

    it("should return minimum value (20) and warn when depth is negative", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(-5)).toBe(20);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too low, using minimum (20)"
      );
    });

    it("should return minimum value (20) and warn when depth is zero", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(0)).toBe(20);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too low, using minimum (20)"
      );
    });

    it("should return exactly 20 when depth is 20 (minimum boundary)", () => {
      expect(validateMaxFiberDepth(20)).toBe(20);
    });

    it("should return the value when depth is valid (between 20 and 10000)", () => {
      expect(validateMaxFiberDepth(50)).toBe(50);
      expect(validateMaxFiberDepth(100)).toBe(100);
      expect(validateMaxFiberDepth(500)).toBe(500);
      expect(validateMaxFiberDepth(1000)).toBe(1000);
      expect(validateMaxFiberDepth(5000)).toBe(5000);
    });

    it("should return exactly 10000 when depth is 10000 (maximum boundary)", () => {
      expect(validateMaxFiberDepth(10000)).toBe(10000);
    });

    it("should return maximum value (10000) and warn when depth is too high", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(15000)).toBe(10000);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too high, using maximum (1000)"
      );
    });

    it("should return floored integer when depth is a float", () => {
      expect(validateMaxFiberDepth(50.7)).toBe(50);
      expect(validateMaxFiberDepth(100.1)).toBe(100);
      expect(validateMaxFiberDepth(99.9)).toBe(99);
    });

    it("should handle floating point edge cases", () => {
      expect(validateMaxFiberDepth(19.9)).toBe(20); // Should clamp to minimum
      expect(validateMaxFiberDepth(20.1)).toBe(20); // Should floor to 20
      expect(validateMaxFiberDepth(10000.9)).toBe(10000); // Should floor to 10000
    });

    it("should handle Infinity", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(Infinity)).toBe(10000);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too high, using maximum (1000)"
      );
    });

    it("should handle negative Infinity", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      expect(validateMaxFiberDepth(-Infinity)).toBe(20);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: maxFiberDepth too low, using minimum (20)"
      );
    });
  });

  describe("validateAutoTracerOptions", () => {
    it("should validate maxFiberDepth and return updated options", () => {
      const options = {
        enabled: true,
        maxFiberDepth: 50,
        includeReconciled: true,
      };

      const result = validateAutoTracerOptions(options);

      expect(result).toEqual({
        enabled: true,
        maxFiberDepth: 50,
        includeReconciled: true,
      });
    });

    it("should preserve all other options while validating maxFiberDepth", () => {
      const options = {
        enabled: false,
        enableAutoTracerInternalsLogging: true,
        includeReconciled: true,
        includeSkipped: false,
        showFlags: true,
        maxFiberDepth: 200,
        showFunctionContentOnChange: true,
        skipNonTrackedBranches: false,
        skippedObjectProps: [
          { objectName: "Component", propNames: ["prop1"] },
        ],
        colors: {
          definitiveRender: {
            icon: "⚡",
            lightMode: { text: "blue" },
            darkMode: { text: "cyan" },
          },
        },
      };

      const result = validateAutoTracerOptions(options);

      expect(result).toEqual({
        enabled: false,
        enableAutoTracerInternalsLogging: true,
        includeReconciled: true,
        includeSkipped: false,
        showFlags: true,
        maxFiberDepth: 200,
        showFunctionContentOnChange: true,
        skipNonTrackedBranches: false,
        skippedObjectProps: [
          { objectName: "Component", propNames: ["prop1"] },
        ],
        colors: {
          definitiveRender: {
            icon: "⚡",
            lightMode: { text: "blue" },
            darkMode: { text: "cyan" },
          },
        },
      });
    });

    it("should fix invalid maxFiberDepth while preserving other options", () => {
      const options = {
        enabled: true,
        maxFiberDepth: -10, // Invalid, should be clamped to 20
        includeReconciled: false,
      };

      const result = validateAutoTracerOptions(options);

      expect(result).toEqual({
        enabled: true,
        maxFiberDepth: 20, // Should be clamped
        includeReconciled: false,
      });
    });

    it("should handle options with undefined maxFiberDepth", () => {
      const options = {
        enabled: true,
        includeReconciled: true,
        // maxFiberDepth is undefined
      };

      const result = validateAutoTracerOptions(options);

      expect(result).toEqual({
        enabled: true,
        maxFiberDepth: 100, // Should default to 100
        includeReconciled: true,
      });
    });

    it("should handle empty options object", () => {
      const options = {};

      const result = validateAutoTracerOptions(options);

      expect(result).toEqual({
        maxFiberDepth: 100, // Should default to 100
      });
    });

    it("should handle options with all kinds of invalid maxFiberDepth values", () => {
      const testCases = [
        { input: { maxFiberDepth: null }, expected: 100 },
        { input: { maxFiberDepth: "string" }, expected: 100 },
        { input: { maxFiberDepth: NaN }, expected: 100 },
        { input: { maxFiberDepth: 5 }, expected: 20 },
        { input: { maxFiberDepth: 15000 }, expected: 10000 },
        { input: { maxFiberDepth: 50.7 }, expected: 50 },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateAutoTracerOptions(
          input as Parameters<typeof validateAutoTracerOptions>[0]
        );
        expect(result.maxFiberDepth).toBe(expected);
      });
    });

    it("should not modify the input options object", () => {
      const originalOptions = {
        enabled: true,
        maxFiberDepth: -10,
        includeReconciled: true,
      };

      const optionsCopy = { ...originalOptions };
      validateAutoTracerOptions(originalOptions);

      // Original should be unchanged
      expect(originalOptions).toEqual(optionsCopy);
    });
  });
});
