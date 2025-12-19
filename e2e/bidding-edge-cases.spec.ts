import { expect, test } from "@playwright/test";
import {
  authedUser,
  auctionDetail101,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("cannot bid when already highest bidder", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  const auctionId = 201;

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { auction: {}, bids: [] }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          ...auctionDetail101,
          id: auctionId,
          highest_bidder_id: authedUser.id,
        }),
  );

  await page.goto(`/auctions/${auctionId}`);
  await expect(
    page.getByRole("button", { name: "You are the highest bidder" }),
  ).toBeDisabled();
});

test("scheduled auction disables bidding", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  const auctionId = 202;

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { auction: {}, bids: [] }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          ...auctionDetail101,
          id: auctionId,
          status: "scheduled",
        }),
  );

  await page.goto(`/auctions/${auctionId}`);
  await expect(
    page.getByRole("button", { name: /Place Your Bid/i }),
  ).toHaveCount(0);
});

test("bid post returns insufficient bids error", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  const auctionId = 203;

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { auction: {}, bids: [] }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}/bids`, (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, { error: "Not enough bids" }, 400);
    }
    return route.continue();
  });
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { ...auctionDetail101, id: auctionId }),
  );

  await page.goto(`/auctions/${auctionId}`);
  await page.getByRole("button", { name: "Place Your Bid" }).click();
  await expect(page.getByRole("alert")).toContainText("Not enough bids");
});

test("outbid broadcast updates UI and history", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  const auctionId = 204;

  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          auction: {},
          bids: [
            {
              id: 5001,
              user_id: authedUser.id,
              username: authedUser.name,
              amount: 125,
              created_at: new Date().toISOString(),
            },
          ],
        }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          ...auctionDetail101,
          id: auctionId,
          highest_bidder_id: null,
          winning_user_name: null,
        }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}/bids`, (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 5002,
          user_id: authedUser.id,
          username: authedUser.name,
          amount: 130,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 130 },
      });
    }
    return route.continue();
  });

  await page.goto(`/auctions/${auctionId}`);
  await page.getByRole("button", { name: "Place Your Bid" }).click();

  // Simulate outbid broadcast.
  await page.route(`**/api/v1/auctions/${auctionId}/bid_history`, (route) =>
    fulfillJson(route, {
      auction: {},
      bids: [
        {
          id: 5003,
          user_id: 999,
          username: "Outbid User",
          amount: 140,
          created_at: new Date().toISOString(),
        },
        {
          id: 5002,
          user_id: authedUser.id,
          username: authedUser.name,
          amount: 130,
          created_at: new Date().toISOString(),
        },
      ],
    }),
  );
  await page.route(`**/api/v1/auctions/${auctionId}`, (route) =>
    fulfillJson(route, {
      ...auctionDetail101,
      id: auctionId,
      current_price: 140,
      highest_bidder_id: 999,
      winning_user_name: "Outbid User",
    }),
  );
  await page.reload();

  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Outbid User",
  );
  await expect(page.getByText("Outbid User bid $140.00")).toBeVisible();
});
