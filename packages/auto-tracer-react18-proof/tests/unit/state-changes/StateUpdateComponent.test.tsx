import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StateUpdateComponent } from "@src/state-changes/StateUpdateComponent";

/**
 * Tests for Scenario 7: State Change Detection (Update)
 * Verifies that state changes are detected and logged on re-render.
 */
describe("StateUpdateComponent", () => {
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

  it("should detect state change on update", async () => {
    const user = userEvent.setup();
    render(<StateUpdateComponent />);

    // Clear initial mount logs
    consoleOutput = [];

    // Click button to trigger state change
    const button = screen.getByText("Update Count");
    await user.click(button);

    // Find state change log
    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change count:")
    );

    expect(stateChangeLog).toBeDefined();
    expect(stateChangeLog).toContain("0");
    expect(stateChangeLog).toContain("5");
  });

  it("should show correct before and after values", async () => {
    const user = userEvent.setup();
    render(<StateUpdateComponent />);

    consoleOutput = [];
    const button = screen.getByText("Update Count");
    await user.click(button);

    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change count:")
    );

    // Verify transition format (0 → 5 or multi-line)
    expect(stateChangeLog).toMatch(/0.*5/);
  });

  it("should render updated state value", async () => {
    const user = userEvent.setup();
    const { container } = render(<StateUpdateComponent />);

    // Initial value
    expect(container.textContent).toContain("Count: 0");

    // After update
    const button = screen.getByText("Update Count");
    await user.click(button);

    expect(container.textContent).toContain("Count: 5");
  });
});
