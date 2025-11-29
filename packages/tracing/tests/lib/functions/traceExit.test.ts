import { describe, expect, it, vi } from "vitest";
import { traceExit } from "../../../src/lib/functions/traceExit.js";

describe("traceExit", () => {
  it("should return a function that calls console.groupEnd", () => {
    const consoleSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn = traceExit("TestScope");
    exitFn();

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log message when provided", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn = traceExit("TestScope");
    exitFn("Exit message");

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[TestScope]%c Exit message",
      "font-weight: bold"
    );
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it("should log message with optional parameters", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn = traceExit("TestScope");
    exitFn("Exit message", { data: "test" }, 123);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[TestScope]%c Exit message",
      "font-weight: bold",
      { data: "test" },
      123
    );
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it("should only call groupEnd when no message or parameters provided", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn = traceExit("TestScope");
    exitFn();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it("should log when only optional parameters provided", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn = traceExit("TestScope");
    exitFn(undefined, { data: "test" });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[TestScope]%c undefined",
      "font-weight: bold",
      { data: "test" }
    );
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it("should handle different scope names", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    const exitFn1 = traceExit("Scope1");
    const exitFn2 = traceExit("Scope2");

    exitFn1("Message 1");
    exitFn2("Message 2");

    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      1,
      "[Scope1]%c Message 1",
      "font-weight: bold"
    );
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      2,
      "[Scope2]%c Message 2",
      "font-weight: bold"
    );
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(2);

    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });
});
