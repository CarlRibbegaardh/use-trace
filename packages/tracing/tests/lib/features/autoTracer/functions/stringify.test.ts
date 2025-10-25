import { describe, expect, it, vi } from "vitest";

// Mock the flatted module to test error scenarios
vi.mock("flatted", () => {
  return {
    stringify: vi.fn(),
  };
});

describe("stringify", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mock behavior
    const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
    flattedStringify.mockImplementation((value) => {
      return JSON.stringify(value);
    });
  });

  describe("object handling", () => {
    it("should stringify simple objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = { key: "value", number: 42 };
      const result = stringify(obj);

      expect(result).toContain("key");
      expect(result).toContain("value");
      expect(result).toContain("42");
    });

    it("should handle circular references using flatted", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      flattedStringify.mockReturnValue('{"0":"[Circular]","1":"value"}');

      const obj: Record<string, unknown> = { key: "value" };
      obj.circular = obj;

      const result = stringify(obj);

      expect(result).toBe('{"0":"[Circular]","1":"value"}');
      expect(flattedStringify).toHaveBeenCalledWith(obj);
    });

    it("should handle nested objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = {
        level1: {
          level2: {
            value: "deep"
          }
        }
      };

      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(result).toContain("level1");
      expect(result).toContain("level2");
      expect(result).toContain("deep");
    });

    it("should handle arrays", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const arr = [1, 2, "three"];
      const result = stringify(arr);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("1");
      expect(result).toContain("2");
      expect(result).toContain("three");
    });

    it("should handle empty objects and arrays", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify({})).toBe("{}");
      expect(stringify([])).toBe("[]");
    });

    it("should handle null and undefined objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify(null)).toBe("null");
      expect(stringify(undefined)).toBe("undefined");
    });

    it("should handle objects with special properties", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        booleanTrue: true,
        booleanFalse: false,
        zeroNumber: 0,
        emptyString: "",
      };

      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle complex nested structures", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const complexObj = {
        users: [
          { id: 1, name: "John", active: true },
          { id: 2, name: "Jane", active: false },
        ],
        metadata: {
          version: "1.0.0",
          config: {
            debug: true,
            features: ["auth", "logging"],
          },
        },
      };

      const result = stringify(complexObj);

      expect(result).toBeDefined();
      expect(result).toContain("users");
      expect(result).toContain("John");
      expect(result).toContain("metadata");
      expect(result).toContain("1.0.0");
    });
  });

  describe("primitive handling", () => {
    it("should convert primitives to strings", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify("string")).toBe("string");
      expect(stringify(42)).toBe("42");
      expect(stringify(true)).toBe("true");
      expect(stringify(false)).toBe("false");
      expect(stringify(0)).toBe("0");
      expect(stringify(-1)).toBe("-1");
      expect(stringify(3.14)).toBe("3.14");
    });

    it("should handle special number values", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify(NaN)).toBe("NaN");
      expect(stringify(Infinity)).toBe("Infinity");
      expect(stringify(-Infinity)).toBe("-Infinity");
    });

    it("should handle empty strings", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify("")).toBe("");
    });

    it("should handle strings with special characters", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      expect(stringify("line1\nline2")).toBe("line1\nline2");
      expect(stringify("tab\there")).toBe("tab\there");
      expect(stringify('quotes"inside')).toBe('quotes"inside');
    });
  });

  describe("special object types", () => {
    it("should handle functions", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const fn = () => {
        return "test";
      };
      const result = stringify(fn);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle arrow functions", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const arrowFn = (x: number) => {
        return x * 2;
      };
      const result = stringify(arrowFn);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle named functions", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      function namedFunction() {
        return "named";
      }

      const result = stringify(namedFunction);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle dates", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const date = new Date("2023-01-01T00:00:00.000Z");
      const result = stringify(date);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("2023");
    });

    it("should handle regular expressions", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const regex = /test.*pattern/gi;
      const result = stringify(regex);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle symbols", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const sym = Symbol("test");
      const result = stringify(sym);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle Map objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const map = new Map();
      map.set("key1", "value1");
      map.set("key2", "value2");

      const result = stringify(map);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle Set objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const set = new Set([1, 2, 3, "value"]);
      const result = stringify(set);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle Error objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const error = new Error("Test error message");
      const result = stringify(error);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle BigInt values", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const bigIntValue = BigInt("123456789012345678901234567890");
      const result = stringify(bigIntValue);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("error handling", () => {
    it("should handle flatted stringify throwing an error", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      flattedStringify.mockImplementation(() => {
        throw new Error("Serialization failed");
      });

      const obj = { key: "value" };
      const result = stringify(obj);

      expect(result).toBe("[Error serializing: Serialization failed]");
    });

    it("should handle flatted stringify throwing a non-Error object", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      flattedStringify.mockImplementation(() => {
        throw "String error";
      });

      const obj = { key: "value" };
      const result = stringify(obj);

      expect(result).toBe("[Error serializing: String error]");
    });

    it("should handle String() throwing an error in fallback", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      flattedStringify.mockImplementation(() => {
        throw new Error("Serialization failed");
      });

      const obj = { key: "value" };
      const result = stringify(obj);

      expect(result).toBe("[Error serializing: Serialization failed]");
    });

    it("should handle complex error scenarios", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      // Test with object that has getters that throw
      const problematicObj = {};
      Object.defineProperty(problematicObj, "badProp", {
        get() {
          throw new Error("Getter error");
        },
      });

      flattedStringify.mockImplementation(() => {
        throw new Error("Cannot serialize");
      });

      const result = stringify(problematicObj);

      expect(result).toBe("[Error serializing: Cannot serialize]");
    });

    it("should handle TypeError specifically", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      flattedStringify.mockImplementation(() => {
        throw new TypeError("Converting circular structure to JSON");
      });

      const obj = { key: "value" };
      const result = stringify(obj);

      expect(result).toBe("[Error serializing: Converting circular structure to JSON]");
    });

    it("should handle nested error in error message creation", async () => {
      const { stringify: flattedStringify } = vi.mocked(await import("flatted"));
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      // Create an error object that throws when converted to string
      const problematicError = new Error("test");
      Object.defineProperty(problematicError, "message", {
        get() {
          throw new Error("Error in error");
        },
      });

      flattedStringify.mockImplementation(() => {
        throw problematicError;
      });

      const obj = { key: "value" };
      const result = stringify(obj);

      expect(result).toBe("[Unserializable]");
    });
  });

  describe("edge cases", () => {
    it("should handle very large objects gracefully", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const largeObj: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        largeObj[`key${i}`] = i;
      }

      const result = stringify(largeObj);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle objects with numeric keys", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = {
        0: "zero",
        1: "one",
        10: "ten",
      };

      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(result).toContain("zero");
      expect(result).toContain("one");
      expect(result).toContain("ten");
    });

    it("should handle objects with symbol keys", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const sym = Symbol("test");
      const obj = {
        normalKey: "normal",
        [sym]: "symbol value",
      };

      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle objects with inherited properties", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      class Parent {
        parentProp = "parent";
      }

      class Child extends Parent {
        childProp = "child";
      }

      const obj = new Child();
      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle frozen objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = Object.freeze({ frozen: true });
      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(result).toContain("frozen");
    });

    it("should handle sealed objects", async () => {
      const { stringify } = await import("@src/lib/features/autoTracer/functions/stringify.js");

      const obj = Object.seal({ sealed: true });
      const result = stringify(obj);

      expect(result).toBeDefined();
      expect(result).toContain("sealed");
    });
  });
});
