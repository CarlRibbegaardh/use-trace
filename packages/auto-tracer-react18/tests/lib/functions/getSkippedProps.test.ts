import { describe, expect, it, vi } from "vitest";
import { getSkippedProps } from "@src/lib/functions/getSkippedProps.js";

// Mock the global state
vi.mock("@src/lib/types/globalState.js", () => {
  return {
    traceOptions: {
      skippedObjectProps: [
        {
          objectName: "Button",
          propNames: ["onClick", "disabled"]
        },
        {
          objectName: "Input",
          propNames: ["value", "onChange", "placeholder"]
        },
        {
          objectName: "Modal",
          propNames: ["isOpen"]
        }
      ]
    }
  };
});

describe("getSkippedProps", () => {
  it("should return empty set when componentName is undefined", () => {
    const result = getSkippedProps(undefined);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return empty set when componentName is not found in config", () => {
    const result = getSkippedProps("NonExistentComponent");

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return correct props for Button component", () => {
    const result = getSkippedProps("Button");

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has("onClick")).toBe(true);
    expect(result.has("disabled")).toBe(true);
    expect(result.has("className")).toBe(false);
  });

  it("should return correct props for Input component", () => {
    const result = getSkippedProps("Input");

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result.has("value")).toBe(true);
    expect(result.has("onChange")).toBe(true);
    expect(result.has("placeholder")).toBe(true);
    expect(result.has("type")).toBe(false);
  });

  it("should return correct props for Modal component", () => {
    const result = getSkippedProps("Modal");

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(1);
    expect(result.has("isOpen")).toBe(true);
    expect(result.has("onClose")).toBe(false);
  });

  it("should handle case-sensitive component names", () => {
    const resultLower = getSkippedProps("button");
    const resultUpper = getSkippedProps("BUTTON");
    const resultCorrect = getSkippedProps("Button");

    expect(resultLower.size).toBe(0);
    expect(resultUpper.size).toBe(0);
    expect(resultCorrect.size).toBe(2);
  });

  it("should handle empty string component name", () => {
    const result = getSkippedProps("");

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should handle null component name", () => {
    const result = getSkippedProps(null as unknown as string);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return a new Set instance each time", () => {
    const result1 = getSkippedProps("Button");
    const result2 = getSkippedProps("Button");

    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });

  it("should not be affected by modifications to returned Set", () => {
    const result1 = getSkippedProps("Button");
    result1.add("newProp");

    const result2 = getSkippedProps("Button");

    expect(result2.has("newProp")).toBe(false);
    expect(result2.size).toBe(2);
  });
});
