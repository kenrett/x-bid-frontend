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

  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);

  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page).toHaveURL(/\/account$/);
});
