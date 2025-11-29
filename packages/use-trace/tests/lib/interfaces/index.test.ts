import { describe, expect, it } from "vitest";
import * as interfacesIndex from "../../../src/lib/interfaces/index.js";

describe("interfaces index", () => {
  it("should export type interfaces", () => {
    // TypeScript interfaces don't exist at runtime, so we just check the module exists
    expect(interfacesIndex).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof interfacesIndex).toBe("object");
  });
});
