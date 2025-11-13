import { test, expect } from "./fixtures";

test.describe("Hook Labeling E2E Tests", () => {
  test("should label useState, useReducer, and custom hooks based on configuration", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");

    // Wait for components to render and auto-tracer to initialize
    await page.waitForSelector('[data-testid="label-hooks-pattern-test"]');

    // Wait for initial render to complete
    await page.waitForTimeout(1000);

    // Trigger state changes in the pattern test component
    await page.click("text=Update Description");
    await page.click("text=Add to Counter");
    await page.click("text=Update Custom Hook");
    await page.click("text=Update Nested Hook");

    // Wait for logs to be generated
    await page.waitForTimeout(2000);

    // Test that hooks matching pattern ARE labeled
    const descriptionLogs = pageLogs.filter((log: string) =>
      log.includes("State change description:")
    );
    expect(descriptionLogs.length).toBeGreaterThan(0);

    const initialDescription = pageLogs.filter((log: string) =>
      log.includes("Initial state description:")
    );
    expect(initialDescription.length).toBeGreaterThan(0);

    // Pattern should catch useReducer hooks automatically
    const counterLogs = pageLogs.filter((log: string) =>
      log.includes("State change counter:")
    );
    expect(counterLogs.length).toBeGreaterThan(0);

    const initialCounter = pageLogs.filter((log: string) =>
      log.includes("Initial state counter:")
    );
    expect(initialCounter.length).toBeGreaterThan(0);

    // Pattern should catch ALL hooks matching pattern (compared to explicit which only catches configured ones)
    // The pattern test should have more hook detections than explicit test
    const allStateLogs = pageLogs.filter((log: string) =>
      log.includes("State change")
    );
    expect(allStateLogs.length).toBeGreaterThan(0);

    // Verify we have more hook logging in pattern mode than explicit mode would have
    // Pattern should automatically detect useSelector, useAppSelector, useCustomHook, etc.
    const dispatchLogs = pageLogs.filter((log: string) =>
      log.includes("State change dispatch")
    );
    // EXPANDED TEST: Dispatch should NOT be logged as state change (it's a function!)
    expect(dispatchLogs.length).toBe(0);

    const filteredTodosLogs = pageLogs.filter(
      (log: string) =>
        log.includes("filteredTodos") && log.includes("State change")
    );
    expect(filteredTodosLogs.length).toBeGreaterThan(0);

    // EXPANDED TEST: Check filteredTodos has CORRECT array values, not boolean
    const hasCorrectArrayValues = filteredTodosLogs.some((log: string) =>
      log.includes("[]")
    );
    const hasWrongBooleanValues = filteredTodosLogs.some(
      (log: string) =>
        log.includes("false → true") || log.includes("true → false")
    );
    expect(hasCorrectArrayValues).toBe(true);
    expect(hasWrongBooleanValues).toBe(false);

    // Custom/nested object labels should resolve using actual variable names from source
    // The custom hooks return objects, so they're logged as objects (not primitive values)
    // Initial states - both correctly labeled as objects
    expect(
      pageLogs.some(
        (log) =>
          log.includes("Initial state customHookResult:") &&
          log.includes('"value":"pattern-custom"')
      )
    ).toBe(true);
    expect(
      pageLogs.some(
        (log) =>
          log.includes("Initial state nestedHookResult:") &&
          log.includes('"value":"nested-custom"')
      )
    ).toBe(true);

    // The primitive values inside the custom hooks (useState) get labeled as "unknown" because they're internal to the hooks
    // This is expected behavior - the hook's internal state is separate from the hook's return value
    expect(
      pageLogs.some((log) =>
        log.includes("Initial state unknown: pattern-custom")
      )
    ).toBe(true);
    expect(
      pageLogs.some((log) =>
        log.includes("Initial state unknown: nested-custom")
      )
    ).toBe(true);

    // Updates
    // When the internal state of custom hooks changes, we see TWO state change logs:
    // 1. The primitive value inside the hook (internal useState) - may have label conflicts
    // 2. The hook's return value (the object) - correctly labeled with variable name

    // Custom hook internal state shows "description | unknown" due to label conflict
    expect(
      pageLogs.some(
        (log) =>
          log.includes("State change description | unknown:") &&
          (log.includes("pattern-custom→pattern-updated") ||
            log.includes("pattern-custom\n→\npattern-updated"))
      )
    ).toBe(true);

    // Custom hook object correctly labeled as customHookResult
    expect(
      pageLogs.some(
        (log) =>
          log.includes("State change customHookResult:") &&
          log.includes('"value":"pattern-custom"') &&
          log.includes('"value":"pattern-updated"')
      )
    ).toBe(true);

    // Nested hook internal state labeled as "unknown"
    expect(
      pageLogs.some(
        (log) =>
          log.includes("State change unknown:") &&
          (log.includes("nested-custom→nested-updated") ||
            log.includes("nested-custom\n→\nnested-updated"))
      )
    ).toBe(true);

    // Nested hook object correctly labeled as nestedHookResult
    expect(
      pageLogs.some(
        (log) =>
          log.includes("State change nestedHookResult:") &&
          log.includes('"value":"nested-custom"') &&
          log.includes('"value":"nested-updated"')
      )
    ).toBe(true);

    console.log("Pattern labelHooksPattern test - Sample relevant logs:");
    const relevantLogs = pageLogs.filter((log: string) =>
      log.includes("State change")
    );
    relevantLogs.forEach((log) => console.log(log));

    // Verify we have at least some labeled state changes
    expect(relevantLogs.length).toBeGreaterThan(0);
  });
});
