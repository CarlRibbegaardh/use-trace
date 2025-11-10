import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for testing labelHooksPattern configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  // Only run our specific test files for pattern configuration
  testMatch: /.*label-hooks-pattern\.spec\.ts/,

  use: {
    baseURL: "http://localhost:5176", // Different port for pattern testing
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

  /* Start dev server before tests using pattern config */
  webServer: {
    command: "vite dev --config vite.config.pattern.ts",
    url: "http://localhost:5176",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
