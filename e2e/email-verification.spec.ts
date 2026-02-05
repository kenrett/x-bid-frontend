import { expect, test } from "./fixtures/test";
import {
  auctionDetail101,
  authedUser,
  fulfillJson,
  isDocumentRequest,
  seedAuthState,
} from "./fixtures/mocks";

const unverifiedUser = {
  ...authedUser,
  email_verified: false,
  email_verified_at: null,
};

test("unverified user sees disabled bid CTA with guidance", async ({
  page,
}) => {
  await seedAuthState(page, unverifiedUser);

  await page.route("**/api/v1/account/security", (route) =>
    fulfillJson(route, { email_verified: false, email_verified_at: null }),
  );
  await page.route("**/api/v1/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail101),
  );
  await page.route("**/api/v1/auctions/101/bid_history", (route) =>
    fulfillJson(route, {
      auction: { winning_user_id: null, winning_user_name: null },
      bids: [],
    }),
  );

  await page.goto("/auctions/101");

  const bidButton = page.getByRole("button", { name: "Verify email to bid" });
  await expect(bidButton).toBeDisabled();
  await expect(
    page.getByText("Verify your email to place bids."),
  ).toBeVisible();
});

test("unverified user cannot start buy-bids checkout", async ({ page }) => {
  await seedAuthState(page, unverifiedUser);

  await page.route("**/api/v1/account/security", (route) =>
    fulfillJson(route, { email_verified: false, email_verified_at: null }),
  );

  await page.goto("/buy-bids");
  await expect(page.getByText(/Verify your email to buy bids/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /verify email/i }),
  ).toHaveAttribute("href", "/account/verify-email");
});

test("403 email_unverified routes to verify-email with guidance", async ({
  page,
}) => {
  await seedAuthState(page, {
    ...authedUser,
    email_verified: true,
    email_verified_at: "2025-01-01T00:00:00Z",
  });

  await page.route("**/api/v1/account/security", (route) =>
    fulfillJson(route, {
      email_verified: true,
      email_verified_at: "2025-01-01T00:00:00Z",
    }),
  );
  await page.route("**/api/v1/bid_packs", (route) =>
    fulfillJson(route, [
      {
        id: 1,
        name: "Starter Pack",
        description: "Warm up with a handful of bids.",
        bids: 50,
        price: 19.99,
        pricePerBid: "0.40",
        highlight: false,
        status: "active",
        active: true,
      },
    ]),
  );
  await page.route("**/api/v1/checkouts", (route) =>
    fulfillJson(route, { error_code: "email_unverified" }, 403),
  );

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: /acquire pack/i }).click();

  await expect(page).toHaveURL(/\/account\/verify-email(\?|$)/);
  await expect(
    page.getByRole("heading", { name: /verify your email/i }),
  ).toBeVisible();
});

test("verify email link shows success state", async ({ page }) => {
  await page.route("**/api/v1/email_verifications/verify**", (route) =>
    fulfillJson(route, { status: "verified" }),
  );

  await page.goto("/verify-email?token=valid-token");

  await expect(
    page.getByRole("heading", { name: /email verified/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
});
