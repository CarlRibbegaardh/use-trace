import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropChangeParent } from "@src/prop-changes/PropChangeParent";

/**
 * Tests for Scenario 5: Prop Change Detection (Update)
 * Verifies that prop changes are detected when parent triggers re-render.
 */
describe("PropChangeParent", () => {
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

  it("should detect prop change when parent updates", async () => {
    const user = userEvent.setup();
    render(<PropChangeParent />);

    // Clear initial mount logs
    consoleOutput = [];

    // Click button to trigger prop change
    const button = screen.getByText("Update");
    await user.click(button);

    // Find prop change log
    const propChangeLog = consoleOutput.find((line) =>
      line.includes("Prop change value:")
    );

    expect(propChangeLog).toBeDefined();
    expect(propChangeLog).toContain("5");
    expect(propChangeLog).toContain("10");
  });

  it("should show correct before and after values", async () => {
    const user = userEvent.setup();
    render(<PropChangeParent />);

    consoleOutput = [];
    const button = screen.getByText("Update");
    await user.click(button);

    const propChangeLog = consoleOutput.find((line) =>
      line.includes("Prop change value:")
    );

    // Verify transition format (5 → 10 or multi-line)
    expect(propChangeLog).toMatch(/5.*10/);
  });

  it("should render updated value in child component", async () => {
    const user = userEvent.setup();
    const { container } = render(<PropChangeParent />);

    // Initial value
    expect(container.textContent).toContain("Value: 5");

    // After update
    const button = screen.getByText("Update");
    await user.click(button);

    expect(container.textContent).toContain("Value: 10");
  });
});
