import { test, expect } from '@playwright/test';

test.describe('Auto-tracer logging (Next client-only)', () => {
  test('should log a Component render cycle on initial load', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const joined = consoleLogs.join('\n');

    // Fails until autoTracer() is initialized on the client
    expect(joined).toContain('Component render cycle');
  });
});
