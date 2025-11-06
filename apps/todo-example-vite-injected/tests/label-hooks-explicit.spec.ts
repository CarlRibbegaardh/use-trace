import { test, expect } from './fixtures';

test.describe('Explicit labelHooks Configuration Tests', () => {
  test('should ONLY label hooks explicitly listed in labelHooks array', async ({ page, pageLogs }) => {
    await page.goto('/');

    // Wait for components to render and auto-tracer to initialize
    await page.waitForSelector('[data-testid="label-hooks-test"]');

    // Wait for initial render to complete
    await page.waitForTimeout(1000);

    // Trigger state changes in the test component
    await page.click('text=Update Title');
    await page.click('text=Increment Count');
    await page.click('text=Update Custom');
    await page.click('text=Update Nested');

    // Wait for logs to be generated
    await page.waitForTimeout(2000);

    // Test that explicitly configured hooks ARE labeled
    const titleLogs = pageLogs.filter((log: string) => log.includes('State change title:'));
    expect(titleLogs.length).toBeGreaterThan(0);

    const countLogs = pageLogs.filter((log: string) => log.includes('State change count:'));
    expect(countLogs.length).toBeGreaterThan(0);

    // Custom hooks should be labeled if explicitly listed
    const customLogs = pageLogs.filter((log: string) => log.includes('State change custom:'));
    expect(customLogs.length).toBeGreaterThan(0);

    // NOTE: We're not testing Redux selectors in this simplified version
    // since we removed Redux dependencies to focus on hook labeling behavior

    console.log('Explicit labelHooks test - Sample relevant logs:');
    const relevantLogs = pageLogs.filter((log: string) => log.includes('State change'));
    relevantLogs.forEach(log => console.log(log));

    // Verify we have the expected labeled state changes
    expect(relevantLogs.length).toBeGreaterThan(2); // At least title, count, custom

    // EXPANDED TEST: Check that dispatch should NOT be logged (it's a function, not state)
    const dispatchLogs = pageLogs.filter((log: string) => log.includes('State change dispatch:'));
    expect(dispatchLogs.length).toBe(0); // Dispatch should NEVER be logged as state!

    // EXPANDED TEST: Check that filteredTodos has ARRAY values, not boolean
    const filteredTodosLogs = pageLogs.filter((log: string) => log.includes('State change filteredTodos:'));
    if (filteredTodosLogs.length > 0) {
      // Should contain array notation [[]] not boolean
      const hasArrayValues = filteredTodosLogs.some((log: string) => log.includes('[[]]'));
      const hasBooleanValues = filteredTodosLogs.some((log: string) =>
        log.includes('false → true') || log.includes('true → false')
      );
      expect(hasArrayValues).toBe(true);
      expect(hasBooleanValues).toBe(false);
    }

    // EXPANDED TEST: Check that loading has BOOLEAN values, not array
    const loadingLogs = pageLogs.filter((log: string) => log.includes('State change loading:'));
    if (loadingLogs.length > 0) {
      // Should contain boolean true/false not array
      const hasBooleanValues = loadingLogs.some((log: string) =>
        log.includes('true') || log.includes('false')
      );
      const hasArrayValues = loadingLogs.some((log: string) => log.includes('[[]]'));
      expect(hasBooleanValues).toBe(true);
      expect(hasArrayValues).toBe(false);
    }
  });
});
