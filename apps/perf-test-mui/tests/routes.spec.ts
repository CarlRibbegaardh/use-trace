import { test, expect, type ConsoleMessage } from '@playwright/test';

/**
 * Console message categorization
 */
interface CapturedLogs {
  errors: string[];
  warnings: string[];
  logs: string[];
  info: string[];
}

/**
 * Helper to capture and categorize console messages
 */
function createLogCapture(): CapturedLogs {
  return {
    errors: [],
    warnings: [],
    logs: [],
    info: []
  };
}

/**
 * Add console message handler to page
 */
function setupConsoleCapture(page: any, logs: CapturedLogs) {
  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();

    switch (type) {
      case 'error':
        logs.errors.push(text);
        break;
      case 'warning':
        logs.warnings.push(text);
        break;
      case 'log':
        logs.logs.push(text);
        break;
      case 'info':
        logs.info.push(text);
        break;
    }
  });

  page.on('pageerror', (error: Error) => {
    logs.errors.push(`Page error: ${error.message}`);
  });
}

/**
 * Filter out expected warnings from libraries (React Router, Redux)
 * while keeping actual application warnings
 */
function filterExpectedWarnings(warnings: string[]): string[] {
  return warnings.filter(warning => {
    // Filter out React Router future flag warnings
    if (warning.includes('React Router Future Flag Warning')) {
      return false;
    }
    // Filter out Redux selector stability warnings in development
    if (warning.includes('input selector returned a different result')) {
      return false;
    }
    // Filter out Redux SerializableStateInvariantMiddleware performance warnings
    if (warning.includes('SerializableStateInvariantMiddleware took')) {
      return false;
    }
    return true;
  });
}

test.describe('Users Dashboard Route', () => {
  test('should render without errors or warnings', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    // Navigate to users dashboard
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify key elements are present
    await expect(page.getByRole('heading', { name: 'Users Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Department Summary' })).toBeVisible();
    await expect(page.getByPlaceholder('Search by name, email, department, or role')).toBeVisible();

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);

    // Log captured messages for debugging
    console.log('=== Users Dashboard Console Logs ===');
    console.log('Errors:', logs.errors);
    console.log('Warnings:', logs.warnings);
    console.log('Info messages count:', logs.info.length);
    console.log('Log messages count:', logs.logs.length);

    // Verify no errors
    expect(logs.errors).toHaveLength(0);

    // Verify no unexpected warnings (filter out React Router and Redux dev warnings)
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });

  test('should handle search interaction without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear any initial logs
    logs.errors = [];
    logs.warnings = [];

    // Interact with search
    const searchInput = page.getByPlaceholder('Search by name, email, department, or role');
    await searchInput.fill('User 1');
    await page.waitForTimeout(500);

    // Verify no errors during interaction
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });

  test('should handle sort change without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear any initial logs
    logs.errors = [];
    logs.warnings = [];

    // Change sort order - find the select button by its visible input
    await page.locator('[role="combobox"]').filter({ hasText: 'Name' }).click();
    await page.getByRole('option', { name: 'Department' }).click();
    await page.waitForTimeout(500);

    // Verify no errors during sort
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });
});

test.describe('Stress Test Route', () => {
  test('should render without errors or warnings', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    // Navigate to stress test page
    await page.goto('/stress');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify key elements are present
    await expect(page.getByRole('heading', { name: 'Performance Stress Test' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stress Test Controls' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product Statistics' })).toBeVisible();

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);

    // Log captured messages for debugging
    console.log('=== Stress Test Console Logs ===');
    console.log('Errors:', logs.errors);
    console.log('Warnings:', logs.warnings);
    console.log('Info messages count:', logs.info.length);
    console.log('Log messages count:', logs.logs.length);

    // Verify no errors
    expect(logs.errors).toHaveLength(0);

    // Verify no unexpected warnings
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });

  test('should handle context update trigger without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    await page.goto('/stress');
    await page.waitForLoadState('networkidle');

    // Clear any initial logs
    logs.errors = [];
    logs.warnings = [];

    // Trigger context update
    await page.getByRole('button', { name: /Trigger Context Update/ }).click();
    await page.waitForTimeout(500);

    // Verify no errors during update
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });

  test('should handle nesting depth change without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    await page.goto('/stress');
    await page.waitForLoadState('networkidle');

    // Clear any initial logs
    logs.errors = [];
    logs.warnings = [];

    // Change nesting depth to maximum
    const depthSlider = page.locator('input[type="range"]').first();
    await depthSlider.fill('5');
    await page.waitForTimeout(500);

    // Verify no errors during depth change
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });

  test('should toggle memo without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    await page.goto('/stress');
    await page.waitForLoadState('networkidle');

    // Clear any initial logs
    logs.errors = [];
    logs.warnings = [];

    // Toggle memo button - use first match since there are two buttons with Memo in name
    await page.getByRole('button', { name: 'Memo OFF' }).first().click();
    await page.waitForTimeout(500);

    // Verify no errors during toggle
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate between routes without errors', async ({ page }) => {
    const logs = createLogCapture();
    setupConsoleCapture(page, logs);

    // Start at users dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to stress test
    await page.getByRole('tab', { name: 'Stress Test' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Performance Stress Test' })).toBeVisible();

    // Navigate back to users dashboard
    await page.getByRole('tab', { name: 'Users Dashboard' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Users Dashboard' })).toBeVisible();

    // Wait for any async operations
    await page.waitForTimeout(1000);

    // Log captured messages
    console.log('=== Navigation Console Logs ===');
    console.log('Errors:', logs.errors);
    console.log('Warnings:', logs.warnings);

    // Verify no errors during navigation
    expect(logs.errors).toHaveLength(0);
    const unexpectedWarnings = filterExpectedWarnings(logs.warnings);
    expect(unexpectedWarnings).toHaveLength(0);
  });
});
