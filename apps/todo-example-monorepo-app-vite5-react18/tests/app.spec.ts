import { test, expect } from "./fixtures";

test.describe("Monorepo Workspace Libraries Demo", () => {
  test("should load and display components from workspace libraries in preview mode", async ({ page, pageLogs }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the app to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check for page errors in console logs
    const errors = pageLogs.filter(log => log.includes("[PAGE ERROR]") || log.includes("[ERROR]"));
    if (errors.length > 0) {
      console.log("Errors found:", errors);
    }

    // Verify the app title is displayed
    await expect(page.locator('h1')).toHaveText("Workspace Libraries Demo");

    // Verify BuiltCounter component is rendered
    await expect(page.locator('h6').filter({ hasText: 'Built Library Counter' })).toBeVisible();
    await expect(page.locator('[data-testid="built-count"]')).toHaveText('0');

    // Verify SourceGreeting component is rendered
    await expect(page.locator('h6').filter({ hasText: 'Source Library Greeting' })).toBeVisible();
    await expect(page.locator('[data-testid="source-greeting"]')).toBeVisible();

    // Test BuiltCounter functionality
    const incrementButton = page.locator('[data-testid="built-increment"]');
    await incrementButton.click();
    await expect(page.locator('[data-testid="built-count"]')).toHaveText('1');

    // Test SourceGreeting functionality
    const nameInput = page.locator('[data-testid="source-name-input"] input');
    await nameInput.fill("Playwright");
    await expect(page.locator('[data-testid="source-greeting"]')).toHaveText('Hello, Playwright!');

    // Verify no errors occurred
    expect(errors).toHaveLength(0);
  });
});
