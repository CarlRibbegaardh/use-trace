import { describe, it, expect } from "vitest";

describe("index.ts exports", () => {
  it("should export all functions", async () => {
    // This will ensure index.ts gets covered
    const {
      transform,
      normalizeConfig,
      matchesPattern,
      shouldProcessFile,
      isComponentFunction,
      extractComponentInfo,
      hasExistingUseAutoTracerImport,
    } = await import("../src/index.js");

    expect(typeof transform).toBe("function");
    expect(typeof normalizeConfig).toBe("function");
    expect(typeof matchesPattern).toBe("function");
    expect(typeof shouldProcessFile).toBe("function");
    expect(typeof isComponentFunction).toBe("function");
    expect(typeof extractComponentInfo).toBe("function");
    expect(typeof hasExistingUseAutoTracerImport).toBe("function");
  });
});
