import { describe, expect, it } from "vitest";
import { areHookInputsEqual } from "../../../src/lib/functions/areHookInputsEqual.js";
import { traceEnter } from "../../../src/lib/functions/traceEnter.js";
import { traceExit } from "../../../src/lib/functions/traceExit.js";
import { traceLogFn } from "../../../src/lib/functions/traceLogFn.js";
import * as functionsIndex from "../../../src/lib/functions/index.js";

describe("functions index", () => {
  it("should export areHookInputsEqual", () => {
    expect(functionsIndex.areHookInputsEqual).toBe(areHookInputsEqual);
  });

  it("should export traceEnter", () => {
    expect(functionsIndex.traceEnter).toBe(traceEnter);
  });

  it("should export traceExit", () => {
    expect(functionsIndex.traceExit).toBe(traceExit);
  });

  it("should export traceLogFn", () => {
    expect(functionsIndex.traceLogFn).toBe(traceLogFn);
  });

  it("should have all expected exports", () => {
    const expectedExports = [
      "areHookInputsEqual",
      "traceEnter",
      "traceExit",
      "traceLogFn"
    ];

    expectedExports.forEach(exportName => {
      expect(functionsIndex).toHaveProperty(exportName);
    });
  });

  it("should not export internal functions", () => {
    const internalExports = ["isRefObject"];

    internalExports.forEach(exportName => {
      expect(functionsIndex).not.toHaveProperty(exportName);
    });
  });
});
