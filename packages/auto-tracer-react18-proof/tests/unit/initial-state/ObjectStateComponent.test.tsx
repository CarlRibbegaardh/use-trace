import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { ObjectStateComponent } from "@src/initial-state/ObjectStateComponent";

/**
 * Tests for Scenario 4: Initial State Output Formatting
 * Verifies formatting of various state types: boolean, object, array.
 */
describe("ObjectStateComponent", () => {
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

  it("should format boolean state correctly", () => {
    render(<ObjectStateComponent />);

    const activeLog = consoleOutput.find((line) =>
      line.includes("Initial state active:")
    );

    expect(activeLog).toContain("true");
  });

  it("should format object state as JSON", () => {
    render(<ObjectStateComponent />);

    const userLog = consoleOutput.find((line) =>
      line.includes("Initial state user:")
    );

    // Verify JSON format with stable key ordering
    expect(userLog).toContain('"id":1');
    expect(userLog).toContain('"name":"Alice"');
  });

  it("should format array state as JSON", () => {
    render(<ObjectStateComponent />);

    const itemsLog = consoleOutput.find((line) =>
      line.includes("Initial state items:")
    );

    // Array should be JSON stringified
    expect(itemsLog).toContain("[1,2,3]");
  });

  it("should format all setter functions as (fn:N)", () => {
    render(<ObjectStateComponent />);

    const setActivLog = consoleOutput.find((line) =>
      line.includes("Initial state setActive:")
    );
    const setUserLog = consoleOutput.find((line) =>
      line.includes("Initial state setUser:")
    );
    const setItemsLog = consoleOutput.find((line) =>
      line.includes("Initial state setItems:")
    );

    expect(setActivLog).toMatch(/\(fn:\d+\)/);
    expect(setUserLog).toMatch(/\(fn:\d+\)/);
    expect(setItemsLog).toMatch(/\(fn:\d+\)/);
  });

  it("should render component correctly with all state values", () => {
    const { container } = render(<ObjectStateComponent />);

    expect(container.textContent).toContain("Active: true");
    expect(container.textContent).toContain("User: Alice");
    expect(container.textContent).toContain("Items: 1, 2, 3");
  });
});
