import { describe, expect, it, vi } from "vitest";
import { traceEnter } from "../../../src/lib/functions/traceEnter.js";

describe("traceEnter", () => {
  it("should call console.group with the scope name", () => {
    const consoleSpy = vi.spyOn(console, "group").mockImplementation(() => {});

    traceEnter("TestScope");

    expect(consoleSpy).toHaveBeenCalledWith("TestScope");

    consoleSpy.mockRestore();
  });

  it("should handle empty string scope name", () => {
    const consoleSpy = vi.spyOn(console, "group").mockImplementation(() => {});

    traceEnter("");

    expect(consoleSpy).toHaveBeenCalledWith("");

    consoleSpy.mockRestore();
  });

  it("should handle scope names with special characters", () => {
    const consoleSpy = vi.spyOn(console, "group").mockImplementation(() => {});

    const specialScopeName = "Test-Scope_123!@#";
    traceEnter(specialScopeName);

    expect(consoleSpy).toHaveBeenCalledWith(specialScopeName);

    consoleSpy.mockRestore();
  });
});
