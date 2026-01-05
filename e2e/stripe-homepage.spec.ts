import { expect, test } from "@playwright/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
} from "./fixtures/mocks";

test("homepage does not load Stripe", async ({ page }) => {
  await setupMockCable(page);

  let stripeRequests = 0;
  await page.route("https://js.stripe.com/**", async (route) => {
    stripeRequests += 1;
    await route.abort();
  });
  await page.route("https://api.stripe.com/**", async (route) => {
    stripeRequests += 1;
    await route.abort();
  });
  await page.route("https://m.stripe.network/**", async (route) => {
    stripeRequests += 1;
    await route.abort();
  });

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );

  await page.goto("/");
  await expect(page.getByText("Your Next Obsession")).toBeVisible();
  expect(stripeRequests).toBe(0);
});
