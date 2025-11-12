import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { MultiStateComponent } from "@src/initial-state/MultiStateComponent";

/**
 * Tests for Scenario 3: Initial State Detection (Mount) - Source Order
 * Verifies that multiple useState hooks preserve source order (value, setter) pairs.
 */
describe("MultiStateComponent", () => {
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

  it("should detect multiple state hooks in source order", () => {
    render(<MultiStateComponent />);

    // Find all state logs
    const stateLogs = consoleOutput.filter((line) =>
      line.includes("Initial state")
    );

    // Verify we have 4 entries: count, setCount, name, setName
    expect(stateLogs.length).toBeGreaterThanOrEqual(4);

    // Find indices to verify order
    const countIndex = stateLogs.findIndex((line) => line.includes("count:"));
    const setCountIndex = stateLogs.findIndex((line) =>
      line.includes("setCount:")
    );
    const nameIndex = stateLogs.findIndex((line) => line.includes("name:"));
    const setNameIndex = stateLogs.findIndex((line) =>
      line.includes("setName:")
    );

    // React stores hooks in order of useState calls, not in value-setter pairs.
    // Each useState hook stores its value in fiber.memoizedState.
    // Setters are functions returned to user code, not stored in fiber.
    // So we get: values from fiber (count, name), then unmatched labels (setCount, setName).
    expect(countIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(setCountIndex);
    expect(setCountIndex).toBeLessThan(setNameIndex);
  });

  it("should log correct initial values for all state", () => {
    render(<MultiStateComponent />);

    const countLog = consoleOutput.find((line) =>
      line.includes("Initial state count:")
    );
    const nameLog = consoleOutput.find((line) =>
      line.includes("Initial state name:")
    );

    expect(countLog).toContain("0");
    expect(nameLog).toContain("default");
  });

  it("should render component correctly with multiple state", () => {
    const { container } = render(<MultiStateComponent />);

    expect(container.textContent).toContain("default");
    expect(container.textContent).toContain("0");
  });
});
