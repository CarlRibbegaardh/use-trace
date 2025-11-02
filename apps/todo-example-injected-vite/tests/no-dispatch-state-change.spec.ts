import { test, expect } from './fixtures';

// Failing characterization test: the tracer must not log state changes for 'dispatch'.
// Currently, logs like "State change dispatch: ..." appear; this test documents the bug.
test.describe('State change logging', () => {
  test('No dispatch state-change logs on initial render', async ({ page, pageLogs }) => {
    await page.goto('/');
    // Allow initial mount logs to flush
    await page.waitForTimeout(300);

    const dispatchLogs = pageLogs.filter((l) => /State change\s+dispatch:/.test(l));

    expect(
      dispatchLogs.length,
      `Expected no "State change dispatch" logs on initial render, got ${dispatchLogs.length}\n\nDispatch logs:\n${dispatchLogs.join(
        '\n'
      )}\n\nAll logs:\n${pageLogs.join('\n')}`
    ).toBe(0);
  });
});
