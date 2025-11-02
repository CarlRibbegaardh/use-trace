import { test, expect } from "./fixtures";

test.describe("Pattern labelHooksPattern Configuration Tests", () => {
  test("should correctly label state changes using pattern configuration", async ({
    page,
    pageLogs,
  }) => {
    await page.goto("/");

    // Wait for page to load and components to render
    await page.waitForTimeout(2000);

    // Get all console logs
    const logOutput = pageLogs.join("\n");

    // Test that the pattern configuration correctly labels the same hooks as explicit config
    const expectedLog1 = "%cState change filteredTodos: [[]] → [[]]";
    const expectedLog2 = "%cState change loading: true → false";

    expect(logOutput).toContain(expectedLog1);
    expect(logOutput).toContain(expectedLog2);
  });
});
