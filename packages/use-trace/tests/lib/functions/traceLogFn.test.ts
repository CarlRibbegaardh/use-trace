import { describe, expect, it, vi } from "vitest";
import { traceLogFn } from "../../../src/lib/functions/traceLogFn.js";

describe("traceLogFn", () => {
  it("should return a function that logs with scope name", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn = traceLogFn("TestScope");
    logFn("Test message");

    expect(consoleSpy).toHaveBeenCalledWith(
      "[TestScope]%c Test message",
      "font-weight: bold"
    );

    consoleSpy.mockRestore();
  });

  it("should handle undefined message", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn = traceLogFn("TestScope");
    logFn();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[TestScope]%c undefined",
      "font-weight: bold"
    );

    consoleSpy.mockRestore();
  });

  it("should handle optional parameters", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn = traceLogFn("TestScope");
    logFn("Message", { data: "test" }, 123, true);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[TestScope]%c Message",
      "font-weight: bold",
      { data: "test" },
      123,
      true
    );

    consoleSpy.mockRestore();
  });

  it("should handle different data types as messages", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn = traceLogFn("TestScope");

    logFn(123);
    expect(consoleSpy).toHaveBeenLastCalledWith(
      "[TestScope]%c 123",
      "font-weight: bold"
    );

    logFn({ object: "test" });
    expect(consoleSpy).toHaveBeenLastCalledWith(
      "[TestScope]%c [object Object]",
      "font-weight: bold"
    );

    logFn(true);
    expect(consoleSpy).toHaveBeenLastCalledWith(
      "[TestScope]%c true",
      "font-weight: bold"
    );

    consoleSpy.mockRestore();
  });

  it("should handle different scope names", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn1 = traceLogFn("Scope1");
    const logFn2 = traceLogFn("Component2");

    logFn1("Message from scope 1");
    logFn2("Message from scope 2");

    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      "[Scope1]%c Message from scope 1",
      "font-weight: bold"
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      "[Component2]%c Message from scope 2",
      "font-weight: bold"
    );

    consoleSpy.mockRestore();
  });

  it("should handle empty scope name", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const logFn = traceLogFn("");
    logFn("Test message");

    expect(consoleSpy).toHaveBeenCalledWith(
      "[]%c Test message",
      "font-weight: bold"
    );

    consoleSpy.mockRestore();
  });
});
