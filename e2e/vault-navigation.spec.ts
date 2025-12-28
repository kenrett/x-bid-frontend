import { expect, test } from "@playwright/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("vault navigation updates the browser URL", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account$/);

  const vaultNav = page.getByRole("navigation", { name: "Vault navigation" });

  await vaultNav.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);

  await vaultNav.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
});
