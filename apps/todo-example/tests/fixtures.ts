import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Capture console logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      const logMessage = `[${type.toUpperCase()}] ${text}`;
      logs.push(logMessage);
      console.log(logMessage); // Print to test runner console
    });

    // Capture page errors
    page.on("pageerror", (error) => {
      const errorMessage = `[PAGE ERROR] ${error.message}`;
      logs.push(errorMessage);
      console.log(errorMessage);
    });

    await use(page);

    // Print all logs at the end of the test if it failed
    if (logs.length > 0) {
      console.log("\n=== Console Logs ===");
      logs.forEach((log) => console.log(log));
      console.log("=== End Console Logs ===\n");
    }
  },
});

export { expect } from "@playwright/test";
