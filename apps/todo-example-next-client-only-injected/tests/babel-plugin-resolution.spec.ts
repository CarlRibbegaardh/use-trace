import { test } from '@playwright/test';

// This test intentionally does nothing except navigate to the root.
// It reproduces the current failure where the Next.js dev server cannot
// start due to a missing Babel plugin resolution.
// The failure occurs during server startup (before the test body runs).
test('dev server should start with Babel plugin', async ({ page }) => {
  await page.goto('/');
});
