import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for testing explicit labelHooks configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  // Only run our specific test files for explicit configuration
  testMatch: /.*label-hooks-explicit\.spec\.ts/,

  use: {
    baseURL: "http://localhost:5173", // Different port for explicit testing
    trace: "on-first-retry",
    video: "off",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start dev server before tests using explicit config */
  webServer: {
    command: "vite dev --config vite.config.explicit.ts",
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
