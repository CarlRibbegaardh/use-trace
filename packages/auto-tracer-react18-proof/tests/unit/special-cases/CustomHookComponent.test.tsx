import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomHookComponent } from "@src/special-cases/CustomHookComponent";

/**
 * Tests for Special Case: Custom Hook Detection (with Labels)
 * Verifies that custom hook values are detected when labeled.
 */
describe("CustomHookComponent", () => {
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

  it("should detect custom hook state with labels", () => {
    render(<CustomHookComponent />);

    // Find initial state logs
    const countLog = consoleOutput.find((line) =>
      line.includes("Initial state count:")
    );
    const incrementLog = consoleOutput.find((line) =>
      line.includes("Initial state increment:")
    );

    expect(countLog).toContain("0");
    expect(incrementLog).toMatch(/\(fn:\d+\)/);
  });

  it("should detect custom hook state changes", async () => {
    const user = userEvent.setup();
    render(<CustomHookComponent />);

    consoleOutput = [];

    // Click button to trigger custom hook state change
    const button = screen.getByRole("button");
    await user.click(button);

    const stateChangeLog = consoleOutput.find((line) =>
      line.includes("State change count:")
    );

    expect(stateChangeLog).toBeDefined();
    expect(stateChangeLog).toContain("0");
    expect(stateChangeLog).toContain("1");
  });

  it("should render component correctly with custom hook", () => {
    const { container } = render(<CustomHookComponent />);

    expect(container.textContent).toContain("Count: 0");
  });
});
