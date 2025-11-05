import { test as base } from '@playwright/test';

export const test = base.extend<{
  pageLogs: string[];
}>({
  pageLogs: async ({}, use) => {
    const logs: string[] = [];
    await use(logs);
  },
  page: async ({ page, pageLogs }, use) => {
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const logMessage = `[${type.toUpperCase()}] ${text}`;
      pageLogs.push(logMessage);
      console.log(logMessage);
    });

    page.on('pageerror', (error) => {
      const errorMessage = `[PAGE ERROR] ${error.message}`;
      pageLogs.push(errorMessage);
      console.log(errorMessage);
    });

    await use(page);

    if (pageLogs.length > 0) {
      console.log('\n=== Console Logs ===');
      pageLogs.forEach((log) => console.log(log));
      console.log('=== End Console Logs ===\n');
    }
  },
});

export { expect } from '@playwright/test';
