import { expect, test } from "./fixtures/test";
import {
  auctionDetail101,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("login shows error on invalid credentials", async ({ page }) => {
  await page.route("**/api/v1/login", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { error: "Invalid credentials" }, 401),
  );

  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password. Please try again.",
  );
});

test("auctions list shows error on server failure", async ({ page }) => {
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { error: "Downstream failure" }, 500),
  );

  await page.goto("/auctions");

  await expect(page.getByRole("alert")).toContainText(
    "Failed to fetch auctions.",
  );
});

test("bid placement error surfaces API message", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail101),
  );
  await page.route("**/api/v1/auctions/101/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { auction: {}, bids: [] }),
  );
  await page.route("**/api/v1/auctions/101/bids", (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, { error: "Not enough bids" }, 400);
    }
    return route.continue();
  });

  await page.goto("/auctions/101");
  const bidButton = page.getByRole("button", { name: "Place Your Bid" });
  await bidButton.click();

  await expect(page.getByRole("alert")).toContainText("Not enough bids");
});

test("checkout shows error when Stripe fails to load", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  // Force Stripe loader to fail.
  await page.addInitScript(() => {
    // @ts-expect-error test-only override consumed when VITE_E2E_TESTS=true
    window.__mockStripePromise = Promise.resolve(null);
  });
  await page
    .context()
    .route("https://js.stripe.com/v3", (route) => route.abort());
  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );

  await page.goto("/buy-bids");

  await expect(page.getByText("Failed to load payments.")).toBeVisible();
});
