import { expect, test } from "@playwright/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  pushCableMessage,
  seedAuthState,
  setupMockCable,
} from "./fixtures/mocks";

const auctionId = 909;
const baseAuction = {
  id: auctionId,
  title: "Resilient Studio Kit",
  description: "Stress-test websocket handling.",
  current_price: 50,
  image_url: "https://example.com/kit.jpg",
  status: "active" as const,
  start_date: "2025-02-01T10:00:00Z",
  end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  highest_bidder_id: 1,
  highest_bidder_name: "Initial Bidder",
  bid_count: 1,
  bids: [],
};

test("connection drop shows banner and recovers", async ({ page }) => {
  await setupMockCable(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          auction: { winning_user_id: 1, winning_user_name: "Initial Bidder" },
          bids: [],
        }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, baseAuction),
  );

  await page.goto(`/auctions/${auctionId}`);
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Initial Bidder",
  );

  const identifier = JSON.stringify({
    channel: "AuctionChannel",
    auction_id: auctionId,
  });

  // Simulate disconnect via mock consumer.
  await page.evaluate((id) => {
    // @ts-expect-error test helper
    window.__mockCableSetState?.(id, "disconnected");
  }, identifier);
  await expect(
    page.getByText("Live feed disconnected. Trying to reconnect."),
  ).toBeVisible();

  // Trigger a reconnect by pushing a confirm_subscription.
  await pushCableMessage(page, {
    identifier: JSON.stringify({
      channel: "AuctionChannel",
      auction_id: auctionId,
    }),
    type: "confirm_subscription",
  });
  await page.evaluate((id) => {
    // @ts-expect-error test helper
    window.__mockCableSetState?.(id, "connected");
  }, identifier);
  await expect(
    page.getByText("Live feed disconnected. Trying to reconnect."),
  ).not.toBeVisible({ timeout: 3000 });
});

test("multiple broadcasts append in order", async ({ page }) => {
  await setupMockCable(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          auction: { winning_user_id: null, winning_user_name: null },
          bids: [],
        }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { ...baseAuction, highest_bidder_id: null }),
  );

  await page.goto(`/auctions/${auctionId}`);
  await page.getByRole("button", { name: "Place Your Bid" }).click();

  const identifier = JSON.stringify({
    channel: "AuctionChannel",
    auction_id: auctionId,
  });
  await pushCableMessage(page, {
    identifier,
    message: {
      current_price: 55,
      bid: {
        id: 7002,
        user_id: 123,
        username: "Second Bidder",
        amount: 55,
        created_at: new Date().toISOString(),
      },
    },
  });
  await pushCableMessage(page, {
    identifier,
    message: {
      current_price: 60,
      bid: {
        id: 7003,
        user_id: 124,
        username: "Third Bidder",
        amount: 60,
        created_at: new Date().toISOString(),
      },
    },
  });

  await expect(page.getByLabel("Current Price")).toHaveText("$60.00");
  await expect(page.getByText("Third Bidder bid $60.00")).toBeVisible();
  await expect(page.getByText("Second Bidder bid $55.00")).toBeVisible();
});
