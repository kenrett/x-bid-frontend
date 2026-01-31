import { test, expect } from "@playwright/test";

type StorefrontCase = {
  hostname: string;
  expected: string;
};

const cases: StorefrontCase[] = [
  { hostname: "www.lvh.me", expected: "main" },
  { hostname: "afterdark.lvh.me", expected: "afterdark" },
  { hostname: "marketplace.lvh.me", expected: "marketplace" },
];

test.describe("storefront runtime selection", () => {
  for (const { hostname, expected } of cases) {
    test(`sets data-storefront for ${hostname}`, async ({ page }) => {
      await page.goto(`http://${hostname}:4173/`);
      await expect(page.locator("html")).toHaveAttribute(
        "data-storefront",
        expected,
      );
    });
  }
});
