import { test, expect } from "./fixtures";

// Verifies identical value detection for non-function values in SimpleIdenticalValueDemo
test.describe("Identical value detection - non-functions", () => {
  test("clicking demo buttons emits identical value warnings", async ({ page }) => {
    const warnings: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("(identical value)")) {
        warnings.push(text.replace(/%c/g, ""));
      }
    });

    await page.goto("/", { waitUntil: "load" });

    // Buttons are labeled with prefixes; use accessible names that start with the label.
    const emptyArrayBtn = page.getByRole("button", { name: /^Empty Array/ });
    const emptyObjectBtn = page.getByRole("button", { name: /^Empty Object/ });
    const arrayBtn = page.getByRole("button", { name: /^Array:/ });
    const objectBtn = page.getByRole("button", { name: /^Object:/ });

    await emptyArrayBtn.click();
    await page.waitForTimeout(200);
    await emptyObjectBtn.click();
    await page.waitForTimeout(200);
    await arrayBtn.click();
    await page.waitForTimeout(200);
    await objectBtn.click();
    await page.waitForTimeout(400);

    const combined = warnings.join("\n");

    // Expect identical value warnings for each corresponding state key label
    expect(combined).toContain("State change emptyArray (identical value)");
    expect(combined).toContain("State change emptyObject (identical value)");
    expect(combined).toContain("State change simpleArray (identical value)");
    expect(combined).toContain("State change simpleObject (identical value)");
  });
});
