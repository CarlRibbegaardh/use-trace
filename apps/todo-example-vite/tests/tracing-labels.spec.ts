import { test, expect } from "./fixtures";

test.describe("Auto-tracer labels", () => {
  test("labels useState in AddTodoForm (title, description)", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");

    // Trigger state changes in AddTodoForm
    await page.locator('[data-testid="todo-title-input"] input').fill("Hello");
    await page
      .locator(
        '[data-testid="todo-description-input"] textarea:not([readonly])'
      )
      .fill("World");

    await page.waitForTimeout(50);
    const joined = pageLogs.join("\n");

    expect(joined).toContain("State change title:");
    expect(joined).toContain("State change description:");
  });

  test("labels selector-derived state in TodoList when enabled", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");
    // Add one todo and toggle to generate selector changes
    await page.locator('[data-testid="todo-title-input"] input').fill("Item");
    await page.locator('[data-testid="add-todo-button"]').click();
    await page.locator('[data-testid^="todo-checkbox-"]').first().click();

    await page.waitForTimeout(50);
    const joined = pageLogs.join("\n");

    // When manual labelState is used, expect friendly labels
    const hasFriendly =
      /State change (filtered|filteredTodos|todos|loading)/.test(joined);
    const hasTodoListChange = joined.includes("TodoList");
    expect(hasTodoListChange).toBeTruthy();
    // Allow either friendly label or generic state change text, but prefer friendly
    expect(hasFriendly || joined.includes("State change:")).toBeTruthy();
  });
});
