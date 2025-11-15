import { test as base } from "@playwright/test";

export const test = base.extend<{
  pageLogs: string[];
}>({
  // eslint-disable-next-line no-empty-pattern
  pageLogs: async ({}, use) => {
    const logs: string[] = [];
    await use(logs);
  },
  page: async ({ page, pageLogs }, use) => {
    // Capture console logs
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      const logMessage = `[${type.toUpperCase()}] ${text}`;
      pageLogs.push(logMessage);
      console.log(logMessage); // Print to test runner console
    });

    // Capture page errors
    page.on("pageerror", (error) => {
      const errorMessage = `[PAGE ERROR] ${error.message}`;
      pageLogs.push(errorMessage);
      console.log(errorMessage);
    });

    await use(page);

    // Print all logs at the end of the test if any were captured
    if (pageLogs.length > 0) {
      console.log("\n=== Console Logs ===");
      pageLogs.forEach((log) => console.log(log));
      console.log("=== End Console Logs ===\n");
    }
  },
});

export { expect } from "@playwright/test";
