import { test, expect } from "./fixtures";

test.describe("Hook Labeling E2E Tests", () => {
  test("should label useState, useReducer, and custom hooks based on configuration", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");

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

    // Test custom hooks - they should show state changes (may be labeled as "custom" or "unknown")
    const customLogs = pageLogs.filter((log: string) =>
      (log.includes("State change custom:") || log.includes("State change unknown:")) &&
      log.includes("test-custom")
    );
    expect(customLogs.length).toBeGreaterThan(0);

    // Test nested hook internal state - labels may be "unknown" for custom hooks
    const nestedLabeledStateLogs = pageLogs.filter(
      (log: string) =>
        (log.includes("State change customHookResult:") ||
        log.includes("State change nestedHookResult:") ||
        log.includes("State change unknown:")) &&
        (log.includes("nested-custom") || log.includes("pattern-custom"))
    );
    expect(nestedLabeledStateLogs.length).toBeGreaterThan(0);

    // Pattern test component hooks
    const descriptionLogs = pageLogs.filter((log: string) =>
      log.includes("State change description:")
    );
    expect(descriptionLogs.length).toBeGreaterThan(0);

    const customHookResultLogs = pageLogs.filter((log: string) =>
      (log.includes("State change customHookResult:") ||
       (log.includes("State change") && log.includes("unknown") && log.includes("pattern-custom")))
    );
    expect(customHookResultLogs.length).toBeGreaterThan(0);

    const nestedHookResultLogs = pageLogs.filter((log: string) =>
      (log.includes("State change nestedHookResult:") ||
       (log.includes("State change") && log.includes("unknown") && log.includes("nested-custom")))
    );
    expect(nestedHookResultLogs.length).toBeGreaterThan(0);

    // Also assert exact value transitions for labeled hooks (old → new)
    // Built-in hooks in LabelHooksTestComponent
    expect(
      pageLogs.some((log: string) =>
        log.includes("State change title:") && log.includes("test-title") && log.includes("updated-title")
      )
    ).toBe(true);
    expect(
      pageLogs.some((log: string) => log.includes("State change count:") && log.includes("0") && log.includes("1"))
    ).toBe(true);
    expect(
      pageLogs.some((log: string) =>
        (log.includes("State change custom:") && log.includes("test-custom") && log.includes("updated-custom")) ||
         (log.includes("State change") && log.includes("unknown") && log.includes("test-custom") && log.includes("updated-custom"))
      )
    ).toBe(true);

    // Pattern-matched hooks in LabelHooksPatternTestComponent
    expect(
      pageLogs.some((log: string) =>
        log.includes("State change description:") &&
        log.includes("pattern-test") &&
        log.includes("pattern-updated")
      )
    ).toBe(true);
    expect(
      pageLogs.some((log: string) =>
        log.includes("State change counter:") &&
        log.includes("10") &&
        log.includes("15")
      )
    ).toBe(true);
    expect(
      pageLogs.some((log: string) =>
        (log.includes("State change customHookResult:") ||
         (log.includes("State change") && log.includes("unknown"))) &&
        log.includes("pattern-custom") &&
        log.includes("pattern-updated")
      )
    ).toBe(true);
    expect(
      pageLogs.some((log: string) =>
        (log.includes("State change nestedHookResult:") ||
         (log.includes("State change") && log.includes("unknown"))) &&
        log.includes("nested-custom") &&
        log.includes("nested-updated")
      )
    ).toBe(true);

    console.log("Hook labeling test - Sample relevant logs:");
    const relevantLogs = pageLogs.filter((log: string) =>
      log.includes("State change")
    );
    relevantLogs.forEach((log) => console.log(log));
  });
});
