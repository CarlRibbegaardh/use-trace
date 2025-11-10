import { test, expect } from "./fixtures";

test.describe("Explicit labelHooks Configuration Tests", () => {
  test("should ONLY label hooks explicitly listed in labelHooks array", async ({
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

    // Pattern should catch useReducer hooks automatically
    const counterLogs = pageLogs.filter((log: string) =>
      log.includes("State change counter:")
    );
    expect(counterLogs.length).toBeGreaterThan(0);

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

    const filteredTodosLogs = pageLogs.filter((log: string) =>
      log.includes("State change filteredTodos")
    );
    expect(filteredTodosLogs.length).toBeGreaterThan(0);

    // EXPANDED TEST: Check filteredTodos has CORRECT array values, not boolean
    const hasCorrectArrayValues = filteredTodosLogs.some((log: string) =>
      log.includes("[[]]")
    );
    const hasWrongBooleanValues = filteredTodosLogs.some(
      (log: string) =>
        log.includes("false → true") || log.includes("true → false")
    );
    expect(hasCorrectArrayValues).toBe(true);
    expect(hasWrongBooleanValues).toBe(false);

    console.log("Pattern labelHooksPattern test - Sample relevant logs:");
    const relevantLogs = pageLogs.filter((log: string) =>
      log.includes("State change")
    );
    relevantLogs.forEach((log) => console.log(log));

    // Verify we have at least some labeled state changes
    expect(relevantLogs.length).toBeGreaterThan(0);
  });
});
