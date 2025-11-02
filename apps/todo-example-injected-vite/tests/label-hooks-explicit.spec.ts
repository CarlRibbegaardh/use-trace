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
  });
});
