import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { UnlabeledStateComponent } from "@src/special-cases/UnlabeledStateComponent";

/**
 * Tests for Special Case: Unlabeled State Detection
 * Verifies that unlabeled hooks show as "unknown".
 */
describe("UnlabeledStateComponent", () => {
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

  it("should show unlabeled state as 'unknown'", () => {
    render(<UnlabeledStateComponent />);

    // Find state log - should show "unknown" for unlabeled hook
    const stateLog = consoleOutput.find((line) =>
      line.includes("Initial state")
    );

    expect(stateLog).toBeDefined();
    expect(stateLog).toContain("unknown");
    expect(stateLog).not.toContain("<unlabeled>");
  });

  it("should still detect and log unlabeled state value", () => {
    render(<UnlabeledStateComponent />);

    const stateLog = consoleOutput.find((line) =>
      line.includes("Initial state unknown:")
    );

    // Value should still be logged
    expect(stateLog).toContain("0");
  });

  it("should render component correctly", () => {
    const { container } = render(<UnlabeledStateComponent />);

    expect(container.textContent).toContain("Count: 0");
  });
});
