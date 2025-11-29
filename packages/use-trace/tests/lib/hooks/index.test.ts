import { describe, expect, it } from "vitest";
import { useTrace } from "../../../src/lib/hooks/useTrace.js";
import * as hooksIndex from "../../../src/lib/hooks/index.js";

describe("hooks index", () => {
  it("should export useTrace", () => {
    expect(hooksIndex.useTrace).toBe(useTrace);
  });

  it("should have all expected exports", () => {
    const expectedExports = ["useTrace"];

    expectedExports.forEach(exportName => {
      expect(hooksIndex).toHaveProperty(exportName);
    });
  });

  it("should not export internal hooks", () => {
    const internalExports = ["useObjectChangeTracker"];

    internalExports.forEach(exportName => {
      expect(hooksIndex).not.toHaveProperty(exportName);
    });
  });
});
