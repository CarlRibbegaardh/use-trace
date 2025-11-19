import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormattingStateComponent } from "@src/state-changes/FormattingStateComponent";

/**
 * Tests for Scenario 8: State Change Output Formatting
 * Verifies formatting for primitive, object, array, and function state changes.
 */
describe("FormattingStateComponent", () => {
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

  it("should format primitive state changes", async () => {
    const user = userEvent.setup();
    render(<FormattingStateComponent />);
    consoleOutput = [];

    const button = screen.getByText("Update Count");
    await user.click(button);

    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change count:")
    );
    expect(stateChangeLog).toBeDefined();
    expect(stateChangeLog).toContain("0");
    expect(stateChangeLog).toContain("5");
  });

  it("should format object state changes as JSON", async () => {
    const user = userEvent.setup();
    render(<FormattingStateComponent />);
    consoleOutput = [];

    const button = screen.getByText("Update User");
    await user.click(button);

    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change user:")
    );
    expect(stateChangeLog).toBeDefined();
    // Should show JSON for both old and new values
  });

  it("should format array state changes as JSON", async () => {
    const user = userEvent.setup();
    render(<FormattingStateComponent />);
    consoleOutput = [];

    const button = screen.getByText("Update Items");
    await user.click(button);

    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change items:")
    );
    expect(stateChangeLog).toBeDefined();
    expect(stateChangeLog).toMatch(/\[1,2,3\]/);
    expect(stateChangeLog).toMatch(/\[4,5,6\]/);
  });

  it("should format function state changes as (fn:N) → (fn:M)", async () => {
    const user = userEvent.setup();
    consoleOutput = [];
    render(<FormattingStateComponent />);

    const button = screen.getByText("Update Callback");
    await user.click(button);

    originalLog(consoleOutput);
    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change callback:")
    );
    expect(stateChangeLog).toBeDefined();
    expect(stateChangeLog).toMatch(/\(fn:\d+\).*\(fn:\d+\)/);
  });
});
