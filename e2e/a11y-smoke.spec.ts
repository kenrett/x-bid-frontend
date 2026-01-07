import { expect, test } from "@playwright/test";
import {
  auction101BidHistory,
  auctionDetail101,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

test("login supports keyboard tab flow within the form", async ({ page }) => {
  await setupMockCable(page);
  await page.goto("/login");

  const email = page.getByLabel("Email address");
  const password = page.getByLabel("Password");
  const submit = page.getByRole("button", { name: "Sign in" });

  await email.focus();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
});

test("signup supports keyboard tab flow within the form", async ({ page }) => {
  await setupMockCable(page);
  await page.goto("/signup");

  const name = page.getByLabel("Name");
  const email = page.getByLabel("Email address");
  const password = page.getByLabel("Password", { exact: true });
  const confirmPassword = page.getByLabel("Confirm password");
  const submit = page.getByRole("button", { name: "Create account" });

  await name.focus();
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirmPassword).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
});

test("bidding CTA is keyboard-operable", async ({ page }) => {
  await setupMockCable(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { ...auctionDetail101, highest_bidder_id: 7 }),
  );
  await page.route("**/api/v1/auctions/101/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction101BidHistory),
  );
  await page.route("**/api/v1/auctions/101/bids", (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 9999,
          user_id: 88,
          username: "Casey Bidder",
          amount: 150,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 150 },
      });
    }
    return route.continue();
  });

  await page.goto("/auctions/101");
  const bidButton = page.getByRole("button", { name: "Place Your Bid" });
  await expect(bidButton).toBeVisible();

  await bidButton.focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("button", { name: "You are the highest bidder" }),
  ).toBeDisabled();
});

test("checkout CTA is keyboard-operable", async ({ page }) => {
  await stubStripe(page);
  await setupMockCable(page);
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

  const acquire = page.getByRole("button", { name: "Acquire Pack" }).first();
  await acquire.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("#checkout")).toBeVisible();
});

test("account deletion confirm modal is keyboard navigable", async ({
  page,
}) => {
  await setupMockCable(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/account", (route) => {
    if (route.request().method() === "DELETE") {
      return fulfillJson(route, {});
    }
    return route.continue();
  });

  await page.goto("/account/data/delete");
  await page.getByLabel("Current password").fill("pw");

  const deleteButton = page.getByRole("button", { name: "Delete account" });
  await deleteButton.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel(/type delete to confirm/i)).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(deleteButton).toBeFocused();
});
