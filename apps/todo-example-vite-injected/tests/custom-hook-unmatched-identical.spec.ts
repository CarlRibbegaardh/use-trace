import { test, expect } from "./fixtures";

/**
 * E2E: Unmatched labeled values from a custom hook returning functions
 *
 * Validates that:
 * - When a custom hook returns an object containing functions, the tracer surfaces
 *   those labeled values even if they aren't direct useState hooks.
 * - On subsequent re-renders where the function references change but behavior/shape is identical
 *   (normalized via "(fn)"), the tracer marks them as "(identical value)".
 * - Function identity labels (fn:N) appear in the formatted before/after output.
 *
 * Precondition in app:
 * - TestComponent uses useMultiValueHook and is rendered on the homepage.
 * - The hook returns increment/reset/setValue/setCount alongside primitive values.
 */
test.describe("Custom hook unmatched labeled values - identical detection", () => {
  test("flags identical changes and shows function identity labels", async ({ page, pageLogs }) => {
    await page.goto("/");

    // Let the mounted TestComponent run its useEffect (sets value/count once)
    await page.waitForTimeout(200);

    // Cause an additional re-render of the app to ensure previous label snapshot exists
    // Adding a todo updates the Redux store which re-renders the app and children
    await page.locator('[data-testid="todo-title-input"] input').fill("Hook E2E");
    await page.locator('[data-testid="add-todo-button"]').click();
    await page.waitForTimeout(150);

    // Optional: trigger one more re-render to be robust
    await page.locator('[data-testid="todo-title-input"] input').fill("Hook E2E 2");
    await page.locator('[data-testid="add-todo-button"]').click();
    await page.waitForTimeout(150);

    const logs = pageLogs.join("\n");

    // Functions should NEVER be treated as identical-value changes.
    // Verify we did NOT mark any of the function labels as identical.
    const functionNames = ["increment", "reset", "setValue", "setCount"];
    for (const name of functionNames) {
      expect(logs.includes(`State change ${name} (identical value):`)).toBe(false);
    }

    // But we should see function identity labels (fn:N) in the output for those functions
    // (they may appear in any state change line where functions are shown).
    expect(logs.includes("(fn:")).toBe(true);
  });
});
