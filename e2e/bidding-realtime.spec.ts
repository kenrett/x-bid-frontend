import { expect, test } from "./fixtures/test";
import {
  authedUser,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  pushCableMessage,
  seedAuthState,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

const liveAuctionId = 777;

const liveAuctionDetail = {
  id: liveAuctionId,
  title: "Studio Lights Bundle",
  description: "Three-point LED kit with stands and softboxes.",
  current_price: 95,
  image_url: "https://example.com/lights.jpg",
  status: "active" as const,
  start_date: "2025-02-01T15:00:00Z",
  end_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  highest_bidder_id: 300,
  highest_bidder_name: "Photo Pro",
  bid_count: 1,
  bids: [],
};

const liveAuctionHistory = {
  auction: {
    winning_user_id: 300,
    winning_user_name: "Photo Pro",
  },
  bids: [
    {
      id: 6001,
      user_id: 300,
      username: "Photo Pro",
      amount: 95,
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
  ],
};

test("user can buy bids, place a bid, and see realtime updates", async ({
  page,
}) => {
  let bidAuthHeader: string | undefined;
  await setupMockCable(page);
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
      return fulfillJson(route, { clientSecret: "cs_test_e2e" });
    }
    return route.continue();
  });

  await page.route(
    `**/api/v1/auctions/${liveAuctionId}/bid_history`,
    (route) =>
      isDocumentRequest(route)
        ? route.continue()
        : fulfillJson(route, liveAuctionHistory),
  );
  await page.route(`**/api/v1/auctions/${liveAuctionId}/bids`, (route) => {
    if (route.request().method() === "POST") {
      bidAuthHeader = route.request().headers()["authorization"];
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 6002,
          user_id: authedUser.id,
          username: authedUser.name,
          amount: 100,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 100 },
      });
    }
    return route.continue();
  });
  await page.route(`**/api/v1/auctions/${liveAuctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, liveAuctionDetail),
  );

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();
  await expect(page.locator("#checkout")).toBeVisible();

  await page.goto(`/auctions/${liveAuctionId}`);

  await expect(
    page.getByRole("heading", { name: "Studio Lights Bundle" }),
  ).toBeVisible();

  await page.waitForFunction(() => {
    // @ts-expect-error injected by setupMockCable
    return window.__cableSubscriptions?.size > 0;
  });

  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Photo Pro",
  );

  await page.getByRole("button", { name: "Place Your Bid" }).click();
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    authedUser.name,
  );
  await expect(page.getByLabel("Current Price")).toHaveText("$100.00");
  await expect(
    page.getByRole("button", { name: "You are the highest bidder" }),
  ).toBeDisabled();

  await pushCableMessage(page, {
    identifier: JSON.stringify({
      channel: "AuctionChannel",
      auction_id: liveAuctionId,
    }),
    message: {
      current_price: 110,
      highest_bidder_id: 501,
      highest_bidder_name: "Studio Ace",
      bid: {
        id: 6003,
        user_id: 501,
        username: "Studio Ace",
        amount: 110,
        created_at: new Date().toISOString(),
      },
    },
  });

  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Studio Ace",
  );
  await expect(page.getByLabel("Current Price")).toHaveText("$110.00");
  await expect(page.getByText("Studio Ace bid $110.00")).toBeVisible();
  expect(bidAuthHeader).toBeUndefined();
});
