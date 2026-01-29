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

test("money loop: checkout success updates balance and purchases are discoverable from wallet", async ({
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

  let checkoutPayload: unknown;
  await page.route("**/api/v1/checkouts", (route) => {
    if (route.request().method() === "POST") {
      checkoutPayload = route.request().postDataJSON();
      return fulfillJson(route, { clientSecret: "cs_test_success" });
    }
    return route.continue();
  });

  const updatedBidCredits = authedUser.bidCredits + 60;
  await page.route("**/api/v1/checkout/success**", (route) =>
    fulfillJson(route, {
      status: "applied",
      purchaseId: "purchase_123",
    }),
  );
  await page.route("**/api/v1/wallet", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          credits_balance: updatedBidCredits,
          as_of: new Date().toISOString(),
          currency: "credits",
        }),
  );
  await page.route("**/api/v1/session/remaining", (route) =>
    fulfillJson(route, {
      remaining_seconds: 1800,
      user: {
        ...authedUser,
        bidCredits: updatedBidCredits,
      },
    }),
  );

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();
  await expect(page.locator("#checkout")).toBeVisible();
  expect(checkoutPayload).toMatchObject({ bid_pack_id: 1 });

  await page.goto("/purchase-status?session_id=sess_money_loop");
  await expect(page.getByText("Purchase Complete")).toBeVisible();
  await expect(page.getByText(`${updatedBidCredits} Bids`)).toBeVisible();

  await page.route("**/api/v1/wallet/transactions**", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          transactions: [],
          page: 1,
          per_page: 25,
          total_count: 0,
          has_more: false,
        }),
  );

  await page.route("**/api/v1/me/purchases", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, [
          {
            id: 501,
            created_at: "2024-05-01T10:00:00Z",
            status: "completed",
            amount_cents: 999,
            currency: "usd",
            receipt_url: null,
            stripe_payment_intent_id: "pi_123",
            stripe_checkout_session_id: "cs_123",
            stripe_event_id: "evt_123",
            bid_pack: {
              id: 1,
              name: "Starter Pack",
              credits: 50,
              price_cents: 1999,
            },
          },
        ]),
  );
  await page.route("**/api/v1/me/purchases/501", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          id: 501,
          created_at: "2024-05-01T10:00:00Z",
          status: "completed",
          amount_cents: 999,
          currency: "usd",
          receipt_url: null,
          stripe_payment_intent_id: "pi_123",
          stripe_checkout_session_id: "cs_123",
          stripe_event_id: "evt_123",
          bid_pack: {
            id: 1,
            name: "Starter Pack",
            credits: 50,
            price_cents: 1999,
          },
        }),
  );

  await page.goto("/account/wallet");
  await expect(
    page.getByRole("heading", { name: "Bid History" }),
  ).toBeVisible();
  await expect(page.getByTestId("wallet-purchases-link")).toBeVisible();

  await page.getByTestId("wallet-purchases-link").click();
  await expect(page.getByRole("heading", { name: "Purchases" })).toBeVisible();
  await expect(page.getByText("Starter Pack")).toBeVisible();

  await page.getByText("Starter Pack").click();
  await expect(page.getByText("Purchase #501")).toBeVisible();
  await expect(page.getByRole("link", { name: /view receipt/i })).toHaveCount(
    0,
  );
});
