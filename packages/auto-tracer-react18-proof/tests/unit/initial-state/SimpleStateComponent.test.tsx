import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { SimpleStateComponent } from "@src/initial-state/SimpleStateComponent";

/**
 * Tests for Scenario 3: Initial State Detection (Mount)
 * Verifies that basic useState hooks are detected and logged on mount.
 */
describe("SimpleStateComponent", () => {
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

  it("should detect and log initial state on mount", () => {
    render(<SimpleStateComponent />);

    // Find the Mount log line
    const mountLog = consoleOutput.find((line) =>
      line.includes("[SimpleStateComponent] Mount")
    );
    expect(mountLog).toBeDefined();

    // Find state logs - both value and setter
    const countStateLog = consoleOutput.find((line) =>
      line.includes("Initial state count:")
    );
    const setCountStateLog = consoleOutput.find((line) =>
      line.includes("Initial state setCount:")
    );

    expect(countStateLog).toContain("0");
    expect(setCountStateLog).toMatch(/\(fn:\d+\)/);
  });

  it("should format setter function as (fn:N)", () => {
    render(<SimpleStateComponent />);

    const setCountStateLog = consoleOutput.find((line) =>
      line.includes("Initial state setCount:")
    );

    // Setter should be formatted as function identity
    expect(setCountStateLog).toMatch(/\(fn:\d+\)/);
  });

  it("should render component correctly with initial state", () => {
    const { container } = render(<SimpleStateComponent />);

    expect(container.textContent).toContain("Count: 0");
  });
});
