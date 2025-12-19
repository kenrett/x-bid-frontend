import { expect, test } from "@playwright/test";
import {
  auction101BidHistory,
  auctionDetail101,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("guest is prompted to log in on buy-bids", async ({ page }) => {
  await page.goto("/buy-bids");

  await expect(
    page.getByRole("heading", { name: "Your Arsenal Awaits" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Log In to Continue" }),
  ).toBeVisible();
});

test("guest can view auction detail but cannot place a bid", async ({
  page,
}) => {
  await page.route("**/api/v1/auctions/101/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction101BidHistory),
  );
  await page.route("**/api/v1/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail101),
  );

  await page.goto("/auctions/101");

  await expect(
    page.getByRole("heading", { name: "Vintage Camera" }),
  ).toBeVisible();
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Mason Wolfe",
  );
  await expect(
    page.getByRole("button", { name: "Place Your Bid" }),
  ).toHaveCount(0);
});

test("guest is redirected away from admin", async ({ page }) => {
  await page.goto("/admin/auctions");

  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fauctions/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("non-admin user is redirected away from admin", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.goto("/admin/auctions");

  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fauctions/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
