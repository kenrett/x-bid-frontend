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

test("checkout polls purchase status until applied and updates balance", async ({
  page,
}) => {
  await stubStripe(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  let checkoutPayload: unknown;
  let checkoutAuthHeader: string | undefined;
  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );
  await page.route("**/api/v1/checkouts", (route) => {
    if (route.request().method() === "POST") {
      checkoutPayload = route.request().postDataJSON();
      checkoutAuthHeader = route.request().headers()["authorization"];
      return fulfillJson(route, { clientSecret: "cs_test_success" });
    }
    return route.continue();
  });

  await page.goto("/buy-bids");

  const proPack = page.getByRole("heading", { name: "Pro Pack" }).locator("..");
  await proPack.getByRole("button", { name: "Acquire Pack" }).click();
  await expect(page.locator("#checkout")).toBeVisible();

  expect(checkoutPayload).toMatchObject({ bid_pack_id: 2 });
  expect(checkoutAuthHeader).toBeUndefined();

  const checkoutSuccessMethods: string[] = [];
  let checkoutStatusCalls = 0;
  await page.route("**/api/v1/checkout/success**", (route) => {
    checkoutSuccessMethods.push(route.request().method());
    checkoutStatusCalls += 1;
    if (route.request().method() !== "GET") {
      throw new Error("checkout status should be read-only GET");
    }
    if (checkoutStatusCalls === 1) {
      return fulfillJson(route, { status: "pending" });
    }
    return fulfillJson(route, { status: "applied" });
  });
  await page.route("**/api/v1/wallet", (route) =>
    fulfillJson(route, {
      credits_balance: 180,
      as_of: new Date().toISOString(),
      currency: "credits",
    }),
  );
  await page.route("**/api/v1/session/remaining", (route) =>
    fulfillJson(route, {
      remaining_seconds: 1800,
      user: {
        ...authedUser,
        bidCredits: 180,
      },
    }),
  );

  await page.goto("/purchase-status?session_id=sess_123");
  await expect(page.getByText("Finalizing purchase")).toBeVisible();
  await expect(page.getByText("Purchase Complete")).toBeVisible();
  await expect(
    page.getByText("Purchase complete. New balance: 180 credits."),
  ).toBeVisible();
  await expect(page.getByText("180 Bids")).toBeVisible();
  expect(checkoutSuccessMethods).toEqual(["GET", "GET"]);
});

test("successful purchase flow shows updated balance and returns to auctions", async ({
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
      return fulfillJson(route, { clientSecret: "cs_test_success" });
    }
    return route.continue();
  });

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();
  await expect(page.locator("#checkout")).toBeVisible();

  const updatedBidCredits = authedUser.bidCredits + 60;
  await page.route("**/api/v1/checkout/success**", (route) =>
    fulfillJson(route, {
      status: "applied",
      purchaseId: "purchase_123",
    }),
  );
  await page.route("**/api/v1/wallet", (route) =>
    fulfillJson(route, {
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

  await page.goto("/purchase-status?session_id=sess_ok");
  await expect(page.getByText("Purchase Complete")).toBeVisible();
  await expect(page.getByText(`${updatedBidCredits} Bids`)).toBeVisible();

  await page.getByRole("link", { name: "Back to Auctions" }).click();
  await expect(page).toHaveURL(/\/auctions$/);
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
    fulfillJson(route, { status: "failed", error: "Payment not completed." }),
  );

  const checkoutSuccessPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/checkout/success") &&
      response.request().method() === "GET",
  );
  await page.goto("/purchase-status?session_id=sess_fail");
  const checkoutSuccess = await checkoutSuccessPromise;
  expect(checkoutSuccess.status()).toBe(200);
  await expect(checkoutSuccess.json()).resolves.toMatchObject({
    status: "failed",
    error: "Payment not completed.",
  });
  await expect(page.getByText("Payment Error")).toBeVisible();
  await expect(page.getByText("Payment not completed.")).toBeVisible();
  await expect(page.getByText(`${authedUser.bidCredits} Bids`)).toBeVisible();
});
