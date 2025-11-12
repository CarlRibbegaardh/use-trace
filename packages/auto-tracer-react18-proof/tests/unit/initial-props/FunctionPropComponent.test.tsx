import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { FunctionPropComponent } from "@src/initial-props/FunctionPropComponent";

/**
 * Tests for Scenario 2: Initial Prop Output Formatting (Functions)
 * Verifies that function props are formatted as (fn:N) on component mount.
 */
describe("FunctionPropComponent", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    consoleOutput = [];
    originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      consoleOutput.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should format function props as (fn:N)", () => {
    const handleClick = () => console.log("clicked");

    render(<FunctionPropComponent onClick={handleClick} label="Submit" />);

    // Find the Mount log line
    const mountLog = consoleOutput.find((line) =>
      line.includes("[FunctionPropComponent] Mount")
    );
    expect(mountLog).toBeDefined();

    // Find function prop log - should show (fn:N) format
    const functionPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop onClick:")
    );
    expect(functionPropLog).toMatch(/\(fn:\d+\)/);

    // String prop should be displayed as-is
    const labelPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop label:")
    );
    expect(labelPropLog).toContain("Submit");
  });

  it("should assign stable function IDs", () => {
    const fn1 = () => {};
    const fn2 = () => {};

    render(<FunctionPropComponent onClick={fn1} label="First" />);
    const firstOutput = [...consoleOutput];

    consoleOutput = [];
    render(<FunctionPropComponent onClick={fn2} label="Second" />);

    // Extract function IDs from both renders
    const firstFnLog = firstOutput.find((line) =>
      line.includes("Initial prop onClick:")
    );
    const secondFnLog = consoleOutput.find((line) =>
      line.includes("Initial prop onClick:")
    );

    // Different functions should have different IDs
    expect(firstFnLog).not.toEqual(secondFnLog);
  });
});
