import { test, expect } from './fixtures';

// Intentional failing test (test-first): assert console logs that indicate
// the tracer is active via auto-injection (render cycle group opening).
// We do not rely on UI hints; we verify logs.

test.describe('Auto-injection logs', () => {
  test('emits render cycle logs on first render', async ({ page, pageLogs }) => {
    await page.goto('/');

    // Wait for initial render
    await page.waitForTimeout(1000);

    const renderCycleLogs = pageLogs.filter((l) =>
      l.includes('Component render cycle:')
    );
    expect(renderCycleLogs.length).toBeGreaterThan(0);
  });
});
