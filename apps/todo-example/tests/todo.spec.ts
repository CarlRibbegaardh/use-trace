import { test, expect } from "./fixtures";

test.describe("Todo App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display empty state initially", async ({ page }) => {
    await expect(
      page.locator('[data-testid="empty-todos-message"]')
    ).toHaveText("No todos yet. Add your first todo above!");
  });

  test("should add a new todo", async ({ page }) => {
    const todoTitle = "Test Todo";
    const todoDescription = "This is a test todo";

    // Fill in the form
    await page
      .locator('[data-testid="todo-title-input"] input')
      .fill(todoTitle);
    await page
      .locator(
        '[data-testid="todo-description-input"] textarea:not([readonly])'
      )
      .fill(todoDescription);

    // Submit the form
    await page.locator('[data-testid="add-todo-button"]').click();

    // Verify the todo was added
    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(1);
    await expect(page.locator('h6[data-testid^="todo-title-"]')).toHaveText(
      todoTitle
    );
    await expect(
      page.locator(
        '[data-testid^="todo-description-"]:not([data-testid="todo-description-input"])'
      )
    ).toHaveText(todoDescription);
    await expect(page.locator('[data-testid^="todo-status-"]')).toHaveText(
      "Pending"
    );

    // Verify form was cleared
    await expect(
      page.locator('[data-testid="todo-title-input"] input')
    ).toHaveValue("");
    await expect(
      page.locator(
        '[data-testid="todo-description-input"] textarea:not([readonly])'
      )
    ).toHaveValue("");
  });

  test("should add multiple todos", async ({ page }) => {
    const todos = [
      { title: "Todo 1", description: "First todo" },
      { title: "Todo 2", description: "Second todo" },
      { title: "Todo 3", description: "Third todo" },
    ];

    for (const todo of todos) {
      await page
        .locator('[data-testid="todo-title-input"] input')
        .fill(todo.title);
      await page
        .locator(
          '[data-testid="todo-description-input"] textarea:not([readonly])'
        )
        .fill(todo.description);
      await page.locator('[data-testid="add-todo-button"]').click();
    }

    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(3);
  });

  test("should not add todo with empty title", async ({ page }) => {
    await page
      .locator(
        '[data-testid="todo-description-input"] textarea:not([readonly])'
      )
      .fill("Description only");

    // Button should be disabled
    await expect(
      page.locator('[data-testid="add-todo-button"]')
    ).toBeDisabled();
  });

  test("should toggle todo completion", async ({ page }) => {
    // Add a todo first
    await page
      .locator('[data-testid="todo-title-input"] input')
      .fill("Test Todo");
    await page.locator('[data-testid="add-todo-button"]').click();

    // Initial state should be pending
    await expect(page.locator('[data-testid^="todo-status-"]')).toHaveText(
      "Pending"
    );

    // Toggle to completed
    await page.locator('[data-testid^="todo-checkbox-"]').click();
    await expect(page.locator('[data-testid^="todo-status-"]')).toHaveText(
      "Completed"
    );

    // Toggle back to pending
    await page.locator('[data-testid^="todo-checkbox-"]').click();
    await expect(page.locator('[data-testid^="todo-status-"]')).toHaveText(
      "Pending"
    );
  });

  test("should delete a todo", async ({ page }) => {
    // Add a todo first
    await page
      .locator('[data-testid="todo-title-input"] input')
      .fill("Test Todo");
    await page.locator('[data-testid="add-todo-button"]').click();

    // Verify todo exists
    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(1);

    // Delete the todo
    await page.locator('[data-testid^="todo-delete-"]').click();

    // Verify todo was deleted
    await expect(
      page.locator('[data-testid="empty-todos-message"]')
    ).toHaveText("No todos yet. Add your first todo above!");
  });

  test("should filter todos by status", async ({ page }) => {
    // Add multiple todos
    const todos = [
      { title: "Pending Todo 1", description: "Should remain pending" },
      { title: "Pending Todo 2", description: "Should remain pending" },
      { title: "Completed Todo", description: "Should be completed" },
    ];

    for (const todo of todos) {
      await page
        .locator('[data-testid="todo-title-input"] input')
        .fill(todo.title);
      await page
        .locator(
          '[data-testid="todo-description-input"] textarea:not([readonly])'
        )
        .fill(todo.description);
      await page.locator('[data-testid="add-todo-button"]').click();
    }

    // Mark the last todo as completed
    const completedTodoCheckbox = page
      .locator('[data-testid^="todo-checkbox-"]')
      .last();
    await completedTodoCheckbox.click();

    // Filter by pending
    await page
      .locator('[data-testid="filter-buttons"] button[value="pending"]')
      .click();
    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(2);

    // Filter by completed
    await page
      .locator('[data-testid="filter-buttons"] button[value="completed"]')
      .click();
    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="todo-status-"]')).toHaveText(
      "Completed"
    );

    // Filter by all
    await page
      .locator('[data-testid="filter-buttons"] button[value="all"]')
      .click();
    await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(3);
  });

  test("should show empty state for filtered results", async ({ page }) => {
    // Add a pending todo
    await page
      .locator('[data-testid="todo-title-input"] input')
      .fill("Pending Todo");
    await page.locator('[data-testid="add-todo-button"]').click();

    // Filter by completed (should show empty state)
    await page
      .locator('[data-testid="filter-buttons"] button[value="completed"]')
      .click();
    await expect(
      page.locator('[data-testid="empty-todos-message"]')
    ).toHaveText("No completed todos.");
  });

  test("should maintain todo count in filter buttons", async ({ page }) => {
    // Add multiple todos and complete some
    const todos = ["Todo 1", "Todo 2", "Todo 3"];

    for (const title of todos) {
      await page.locator('[data-testid="todo-title-input"] input').fill(title);
      await page.locator('[data-testid="add-todo-button"]').click();
    }

    // Mark first todo as completed
    await page.locator('[data-testid^="todo-checkbox-"]').first().click();

    // Check all filter shows total count
    await expect(page.locator("text=Todos (3)")).toBeVisible();

    // Filter by pending
    await page
      .locator('[data-testid="filter-buttons"] button[value="pending"]')
      .click();
    await expect(page.locator("text=Todos (2)")).toBeVisible();

    // Filter by completed
    await page
      .locator('[data-testid="filter-buttons"] button[value="completed"]')
      .click();
    await expect(page.locator("text=Todos (1)")).toBeVisible();
  });
});
