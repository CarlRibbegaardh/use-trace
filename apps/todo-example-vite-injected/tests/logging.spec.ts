import { test, expect } from "./fixtures";

/**
 * E2E verification for state hook logging including identical value warnings.
 *
 * Specification alignment:
 * - detectIdenticalValueChanges is enabled by default (boolean true)
 * - Identical state changes include the substring `(identical value)` and use the same base label format
 * - We only assert on meaningful substrings; styles and icon decorations are ignored
 */
test.describe("State Hook Logging", () => {
  test("should log identical value warning for filteredTodos and loading transitions", async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const messageText = msg.text();
      if (messageText.includes("State change")) {
        const cleanedLog = messageText
          .replace(/%c/g, "")
          // Remove style artifacts that sometimes appear in captured console text
          .replace(/color: #[0-9a-fA-F]{3,6}/g, "")
          .replace(/font-[a-zA-Z-]+: [^;]+/g, "")
          .trim();
        consoleLogs.push(cleanedLog);
      }
    });

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(800); // Allow tracer cycles + async toggles

    const logOutput = consoleLogs.join("\n");

    // Identical value warning for filteredTodos (empty array recreated)
    expect(logOutput).toContain(
      "State change filteredTodos (identical value): [] → []"
    );

    // Loading toggles twice; assert both directions for robustness
    expect(logOutput).toContain("State change loading: false → true");
    expect(logOutput).toContain("State change loading: true → false");
  });
});
