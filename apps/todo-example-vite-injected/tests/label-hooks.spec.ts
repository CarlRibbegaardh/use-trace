import { test, expect } from "./fixtures";

test.describe("Hook Labeling E2E Tests", () => {
  test("should label useState, useReducer, and custom hooks based on configuration", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("http://localhost:5174");

    // Wait for components to render and auto-tracer to initialize
    await page.waitForSelector('[data-testid="label-hooks-test"]');
    await page.waitForSelector('[data-testid="label-hooks-pattern-test"]');

    // Wait for initial render to complete
    await page.waitForTimeout(1000);

    // Trigger state changes in the LabelHooksTestComponent
    await page.click("text=Update Title");
    await page.click("text=Increment Count");
    await page.click("text=Update Custom");

    // Trigger state changes in the LabelHooksPatternTestComponent
    await page.click("text=Update Description");
    await page.click("text=Add to Counter");
    await page.click("text=Update Custom Hook");
    await page.click("text=Update Nested Hook");

    // Wait for logs to be generated
    await page.waitForTimeout(2000);

    // Test labelHooks configuration (should label built-ins and configured hooks)
    const titleLogs = pageLogs.filter((log: string) =>
      log.includes("State change title:")
    );
    expect(titleLogs.length).toBeGreaterThan(0);

    const countLogs = pageLogs.filter((log: string) =>
      log.includes("State change count:")
    );
    expect(countLogs.length).toBeGreaterThan(0);

    // Test labelHooksPattern configuration (should label custom hooks via pattern)
    const customLogs = pageLogs.filter((log: string) =>
      log.includes("State change custom:")
    );
    expect(customLogs.length).toBeGreaterThan(0);

    // Test nested hook internal state - looking for unlabeled state changes from nested hooks
    const unlabeledStateLogs = pageLogs.filter(
      (log: string) =>
        log.includes("State change: 2 → 4") ||
        log.includes("State change: 2 → 3")
    );
    expect(unlabeledStateLogs.length).toBeGreaterThan(0);

    // Pattern test component hooks
    const descriptionLogs = pageLogs.filter((log: string) =>
      log.includes("State change description:")
    );
    expect(descriptionLogs.length).toBeGreaterThan(0);

    const customHookResultLogs = pageLogs.filter((log: string) =>
      log.includes("State change customHookResult:")
    );
    expect(customHookResultLogs.length).toBeGreaterThan(0);

    const nestedHookResultLogs = pageLogs.filter((log: string) =>
      log.includes("State change nestedHookResult:")
    );
    expect(nestedHookResultLogs.length).toBeGreaterThan(0);

    console.log("Hook labeling test - Sample relevant logs:");
    const relevantLogs = pageLogs.filter((log: string) =>
      log.includes("State change")
    );
    relevantLogs.forEach((log) => console.log(log));
  });
});
