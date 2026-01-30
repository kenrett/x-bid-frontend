import { expect, test } from "./fixtures/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("account navigation updates the browser URL", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account$/);

  const accountNav = page.getByRole("navigation", {
    name: "Account navigation",
  });

  await accountNav.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile$/);

  await accountNav.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
});
