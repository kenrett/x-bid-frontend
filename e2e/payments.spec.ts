import { expect, test } from "@playwright/test";
import {
  authedUser,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
  stubStripe,
} from "./fixtures/mocks";

test("checkout posts selected pack and updates balance on success", async ({
  page,
}) => {
  await stubStripe(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  let checkoutPayload: unknown;
  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );
  await page.route("**/api/v1/checkouts", (route) => {
    if (route.request().method() === "POST") {
      checkoutPayload = route.request().postDataJSON();
      return fulfillJson(route, { clientSecret: "cs_test_success" });
    }
    return route.continue();
  });

  await page.goto("/buy-bids");

  const proPack = page.getByRole("heading", { name: "Pro Pack" }).locator("..");
  await proPack.getByRole("button", { name: "Acquire Pack" }).click();
  await expect(page.locator("#checkout")).toBeVisible();

  expect(checkoutPayload).toMatchObject({ bid_pack_id: 2 });

  await page.route("**/api/v1/checkout/success**", (route) =>
    fulfillJson(route, { status: "success", updated_bid_credits: 180 }),
  );

  await page.goto("/purchase-status?session_id=sess_123");
  await expect(page.getByText("Payment Successful")).toBeVisible();
  await expect(
    page.getByText("Your purchase was successful! New balance: 180 credits."),
  ).toBeVisible();
  await expect(page.getByText("180 Bids")).toBeVisible();
});

test("payment failure shows error and keeps balance unchanged", async ({
  page,
}) => {
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
      return fulfillJson(route, { clientSecret: "cs_test_error" });
    }
    return route.continue();
  });

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();
  await expect(page.locator("#checkout")).toBeVisible();

  await page.route("**/api/v1/checkout/success**", (route) =>
    fulfillJson(route, { status: "error", error: "Card declined" }),
  );

  await page.goto("/purchase-status?session_id=sess_fail");
  await expect(page.getByText("Payment Error")).toBeVisible();
  await expect(page.getByText("Card declined")).toBeVisible();
  await expect(page.getByText(`${authedUser.bidCredits} Bids`)).toBeVisible();
});
