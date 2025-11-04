import { test, expect } from '@playwright/test';

test.describe('Todo App Mixed Mode (SSR + Client Components)', () => {
  test('should render server-side content and client components', async ({ page }) => {
    await page.goto('/');

    // Verify the main heading is rendered (this should be server-side)
    await expect(page.locator('[data-testid="home-title"]')).toHaveText('Todo Application');

    // Verify the subtitle explaining SSR + Client architecture
    await expect(page.locator('text=This is a Server Component that renders static content on the server')).toBeVisible();

    // Verify the AppBar title shows "Mixed Mode"
    await expect(page.locator('text=Todo App - Mixed Mode (SSR + Client Components)')).toBeVisible();
  });

  test('should have functional client-side todo form', async ({ page }) => {
    await page.goto('/');

    // Test the AddTodoForm (client component)
    const titleInput = page.locator('[data-testid="todo-title-input"] input');
    const descriptionInput = page.getByRole('textbox', { name: 'Description (optional)' });
    const addButton = page.locator('[data-testid="add-todo-button"]');

    await titleInput.fill('Test Todo from Mixed Mode');
    await descriptionInput.fill('This todo was added via client component');
    await addButton.click();

    // Verify the todo appears in the list
    await expect(page.locator('text=Test Todo from Mixed Mode')).toBeVisible();
  });

  test('should have working test components for auto-tracer', async ({ page }) => {
    await page.goto('/');

    // Verify auto-injection demo section
    await expect(page.locator('text=Auto-Injection Demo:')).toBeVisible();

    // Test the test component button
    const testButton = page.locator('button:has-text("Click me (auto-traced!)")');
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Verify label hooks test sections
    await expect(page.locator('text=Label Hooks Test:')).toBeVisible();
    await expect(page.locator('text=Label Hooks Pattern Test:')).toBeVisible();
  });
});
