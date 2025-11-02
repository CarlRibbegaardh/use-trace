import { test, expect } from "./fixtures";

test.describe("State Hook Logging", () => {
  test("should correctly label state changes on initial load", async ({
    page,
  }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      // The tracer formats logs with specific prefixes. We can join the message parts.
      const messageText = msg.text();
      if (messageText.includes("State change")) {
        // Normalize the log by removing color codes and trimming whitespace
        const cleanedLog = messageText.replace(/%c/g, "").trim();
        consoleLogs.push(cleanedLog);
      }
    });

    // Go to the page and wait for the initial data fetch to complete.
    // The `load` state ensures all initial network requests are likely done.
    await page.goto("/", { waitUntil: "load" });

    // Add a small delay to ensure all async logging has been processed.
    await page.waitForTimeout(500);

    const logOutput = consoleLogs.join("\n");

    // This assertion will fail until the bug is fixed.
    // It looks for the exact, literal output you specified.
    const expectedLog1 = "State change filteredTodos: [[]] → [[]]";
    const expectedLog2 = "State change loading: true → false";

    expect(logOutput).toContain(expectedLog1);
    expect(logOutput).toContain(expectedLog2);
  });
});
