import { test, expect } from "./fixtures";

test.describe("Explicit labelHooks Configuration Tests", () => {
  test("should correctly label state changes using explicit configuration", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");

    // Wait for page to load and components to render
    await page.waitForTimeout(2000);

    // Get all console logs
    const logOutput = pageLogs.join("\n");

    // Test that the explicit configuration correctly labels the same hooks as pattern config
    const expectedLog1 = "%cState change filteredTodos: [[]] → [[]]";
    const expectedLog2 = "%cState change loading: true → false";

    expect(logOutput).toContain(expectedLog1);
    expect(logOutput).toContain(expectedLog2);
  });
});
