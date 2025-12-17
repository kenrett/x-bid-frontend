import { expect, test } from "@playwright/test";
import {
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
  stubStripe,
} from "./fixtures/mocks";

test("authenticated user can start a bid pack checkout", async ({ page }) => {
  await stubStripe(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );
  await page.route("**/api/v1/checkouts", (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, { clientSecret: "cs_test_fake" });
    }
    return route.continue();
  });

  await page.goto("/buy-bids");

  await expect(
    page.getByRole("heading", { name: "Starter Pack" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();

  await expect(page.locator("#checkout")).toBeVisible();
});
