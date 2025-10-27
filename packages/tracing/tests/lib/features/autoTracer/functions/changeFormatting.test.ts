import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type FormatOptions,
  formatPropChange,
  formatPropValue,
  formatStateChange,
  formatStateValue,
} from "@src/lib/features/autoTracer/functions/changeFormatting.js";

// Mock the stringify module to mirror actual behavior
vi.mock("@src/lib/features/autoTracer/functions/stringify.js", () => {
  return {
    stringify: vi.fn((value) => {
      try {
        if (typeof value === "object") {
          if (value === null) {
            return "null";
          }
          // Simple circular reference detection for tests
          try {
            return JSON.stringify(value);
          } catch (error) {
            if (error instanceof TypeError && error.message.includes("circular")) {
              return "[Circular]";
            }
            throw error;
          }
        } else {
          return String(value);
        }
      } catch (error) {
        return `[Error serializing: ${error instanceof Error ? error.message : String(error)}]`;
      }
    }),
  };
});

describe("changeFormatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const showFunctionOptions: FormatOptions = { showFunctionContent: true };
  const hideFunctionOptions: FormatOptions = { showFunctionContent: false };

  describe("formatPropValue", () => {
    it("should format non-function values using stringify", () => {
      expect(formatPropValue("hello", showFunctionOptions)).toBe("hello");
      expect(formatPropValue(42, showFunctionOptions)).toBe("42");
      expect(formatPropValue({ key: "value" }, showFunctionOptions)).toBe('{"key":"value"}');
      expect(formatPropValue(null, showFunctionOptions)).toBe("null");
      expect(formatPropValue(undefined, showFunctionOptions)).toBe("undefined");
    });

    it("should format functions when showFunctionContent is true", () => {
      const testFn = function test() { return "hello"; };
      const result = formatPropValue(testFn, showFunctionOptions);
      expect(result).toContain("function test()");
    });

    it("should format functions as [Function] when showFunctionContent is false", () => {
      const testFn = function test() { return "hello"; };
      const arrowFn = () => {
        return "hello";
      };

      expect(formatPropValue(testFn, hideFunctionOptions)).toBe("[Function]");
      expect(formatPropValue(arrowFn, hideFunctionOptions)).toBe("[Function]");
    });

    it("should handle edge cases", () => {
      expect(formatPropValue([], showFunctionOptions)).toBe("[]");
      expect(formatPropValue({}, showFunctionOptions)).toBe("{}");
      expect(formatPropValue(true, showFunctionOptions)).toBe("true");
      expect(formatPropValue(false, showFunctionOptions)).toBe("false");
    });
  });

  describe("formatStateValue", () => {
    it("should format non-function values using stringify", () => {
      expect(formatStateValue("state", showFunctionOptions)).toBe("state");
      expect(formatStateValue(123, showFunctionOptions)).toBe("123");
      expect(formatStateValue({ count: 0 }, showFunctionOptions)).toBe('{"count":0}');
    });

    it("should format functions when showFunctionContent is true", () => {
      const stateFn = function reducer() { return {}; };
      const result = formatStateValue(stateFn, showFunctionOptions);
      expect(result).toContain("function reducer()");
    });

    it("should format functions as [Function] when showFunctionContent is false", () => {
      const stateFn = function reducer() { return {}; };
      expect(formatStateValue(stateFn, hideFunctionOptions)).toBe("[Function]");
    });
  });

  describe("formatPropChange", () => {
    it("should format changes between non-function values", () => {
      expect(formatPropChange("old", "new", showFunctionOptions)).toBe("old → new");
      expect(formatPropChange(1, 2, showFunctionOptions)).toBe("1 → 2");
      expect(formatPropChange(null, "value", showFunctionOptions)).toBe("null → value");
    });

    it("should show [Function changed] when before is function and showFunctionContent is false", () => {
      const oldFn = function old() {};
      const newFn = function newer() {};

      expect(formatPropChange(oldFn, newFn, hideFunctionOptions)).toBe("[Function changed]");
      expect(formatPropChange(oldFn, "string", hideFunctionOptions)).toBe("[Function changed]");
    });

    it("should show full function content when showFunctionContent is true", () => {
      const oldFn = function old() {};
      const newFn = function newer() {};

      const result = formatPropChange(oldFn, newFn, showFunctionOptions);
      expect(result).toContain("function old()");
      expect(result).toContain("→");
      expect(result).toContain("function newer()");
    });

    it("should handle mixed function/non-function changes", () => {
      const fn = function test() {};

      // When before is not a function, show full change even with hideFunctionOptions
      expect(formatPropChange("string", fn, hideFunctionOptions)).toContain("→");
      expect(formatPropChange(123, fn, hideFunctionOptions)).toContain("→");
    });
  });

  describe("formatStateChange", () => {
    it("should format changes between non-function values", () => {
      expect(formatStateChange(0, 1, showFunctionOptions)).toBe("0 → 1");
      expect(formatStateChange({ count: 0 }, { count: 1 }, showFunctionOptions)).toBe('{"count":0} → {"count":1}');
    });

    it("should show [Function changed] when before is function and showFunctionContent is false", () => {
      const oldReducer = function oldReducer() {};
      const newReducer = function newReducer() {};

      expect(formatStateChange(oldReducer, newReducer, hideFunctionOptions)).toBe("[Function changed]");
    });

    it("should show full function content when showFunctionContent is true", () => {
      const oldReducer = function oldStateReducer() {};
      const newState = { value: "new" };

      const result = formatStateChange(oldReducer, newState, showFunctionOptions);
      expect(result).toContain("function oldStateReducer()");
      expect(result).toContain("→");
      expect(result).toContain('{"value":"new"}');
    });
  });

  describe("edge cases and consistency", () => {
    it("should handle circular references gracefully", () => {
      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;

      // stringify should handle circular references
      const result = formatPropValue(circular, showFunctionOptions);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should be consistent between prop and state formatting", () => {
      const testValue = { key: "value" };
      const propResult = formatPropValue(testValue, showFunctionOptions);
      const stateResult = formatStateValue(testValue, showFunctionOptions);

      expect(propResult).toBe(stateResult);
    });

    it("should be consistent between prop and state change formatting", () => {
      const before = "old";
      const after = "new";

      const propResult = formatPropChange(before, after, showFunctionOptions);
      const stateResult = formatStateChange(before, after, showFunctionOptions);

      expect(propResult).toBe(stateResult);
    });
  });
});
