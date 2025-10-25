import { describe, expect, it } from "vitest";
import { stringify } from "@src/lib/features/autoTracer/functions/stringify.js";

describe("stringify", () => {
  it("should stringify simple objects", () => {
    const obj = { key: "value", number: 42 };
    const result = stringify(obj);

    expect(result).toContain("key");
    expect(result).toContain("value");
    expect(result).toContain("42");
  });

  it("should handle circular references", () => {
    const obj: Record<string, unknown> = { key: "value" };
    obj.circular = obj;

    const result = stringify(obj);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    // Should not throw and should handle circular reference
    expect(result.length).toBeGreaterThan(0);
  });

  it("should convert primitives to strings", () => {
    expect(stringify("string")).toBe("string");
    expect(stringify(42)).toBe("42");
    expect(stringify(true)).toBe("true");
    expect(stringify(null)).toBe("[null]"); // flatted wraps primitives
    expect(stringify(undefined)).toBe("undefined");
  });

  it("should handle arrays", () => {
    const arr = [1, 2, "three"];
    const result = stringify(arr);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("three");
  });

  it("should handle nested objects", () => {
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

  it("should handle functions", () => {
    const fn = () => {
      return "test";
    };
    const result = stringify(fn);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle symbols", () => {
    const sym = Symbol("test");
    const result = stringify(sym);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle dates", () => {
    const date = new Date("2023-01-01");
    const result = stringify(date);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result).toContain("2023");
  });

  it("should handle empty objects and arrays", () => {
    expect(stringify({})).toBe("[{}]"); // flatted wraps objects in arrays
    expect(stringify([])).toBe("[[]]"); // flatted wraps arrays in arrays
  });
});
