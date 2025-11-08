import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatPropChange,
  formatPropValue,
  formatStateChange,
  formatStateValue,
} from "@src/lib/functions/changeFormatting.js";

// Mock the stringify module to mirror actual behavior
vi.mock("@src/lib/functions/stringify.js", () => {
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

  describe("formatPropValue", () => {
    it("should format non-function values using stringify", () => {
      expect(formatPropValue("hello")).toBe("hello");
      expect(formatPropValue(42)).toBe("42");
      expect(formatPropValue({ key: "value" })).toBe('{"key":"value"}');
      expect(formatPropValue(null)).toBe("null");
      expect(formatPropValue(undefined)).toBe("undefined");
    });

    it("should handle edge cases", () => {
      expect(formatPropValue([])).toBe("[]");
      expect(formatPropValue({})).toBe("{}");
      expect(formatPropValue(true)).toBe("true");
      expect(formatPropValue(false)).toBe("false");
    });
  });

  describe("formatStateValue", () => {
    it("should format non-function values using stringify", () => {
      expect(formatStateValue("state")).toBe("state");
      expect(formatStateValue(123)).toBe("123");
      expect(formatStateValue({ count: 0 })).toBe('{"count":0}');
    });
  });

  describe("formatPropChange", () => {
    it("should format changes between values", () => {
      expect(formatPropChange("old", "new")).toBe("old → new");
      expect(formatPropChange(1, 2)).toBe("1 → 2");
      expect(formatPropChange(null, "value")).toBe("null → value");
    });
  });

  describe("formatStateChange", () => {
    it("should format changes between values", () => {
      expect(formatStateChange(0, 1)).toBe("0 → 1");
      expect(formatStateChange({ count: 0 }, { count: 1 })).toBe('{"count":0} → {"count":1}');
    });
  });

  describe("edge cases and consistency", () => {
    it("should handle circular references gracefully", () => {
      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;

      // stringify should handle circular references
      const result = formatPropValue(circular);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should be consistent between prop and state formatting", () => {
      const testValue = { key: "value" };
      const propResult = formatPropValue(testValue);
      const stateResult = formatStateValue(testValue);

      expect(propResult).toBe(stateResult);
    });

    it("should be consistent between prop and state change formatting", () => {
      const before = "old";
      const after = "new";

      const propResult = formatPropChange(before, after);
      const stateResult = formatStateChange(before, after);

      expect(propResult).toBe(stateResult);
    });
  });
});
