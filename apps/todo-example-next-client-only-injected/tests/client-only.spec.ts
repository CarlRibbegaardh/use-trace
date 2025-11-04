import { test, expect } from '@playwright/test';

// Real test; will pass once the app renders the title.
// Run with: pnpm --filter next-client-only-example test:e2e

test('home page shows heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-title')).toBeVisible();
});
