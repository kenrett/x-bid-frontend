import { expect, test } from "./fixtures/test";
import {
  adminUser,
  auction101BidHistory,
  auctionDetail101,
  auctionList,
  authedUser,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  pushCableMessage,
  setAuthOverride,
  setSessionOverride,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

const pause = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

const liveAuctionId = 777;

test("records end-to-end product walkthrough", async ({ page }) => {
  await setupMockCable(page);
  await stubStripe(page);

  const creditsBalance = 180;
  const demoUser = { ...authedUser, bidCredits: creditsBalance };
  const adminSessionUser = { ...adminUser, bidCredits: creditsBalance };

  const liveAuction = {
    id: liveAuctionId,
    title: "Studio Lights Bundle",
    description: "Three-point LED kit with stands and softboxes.",
    current_price: 95,
    image_url: "https://example.com/lights.jpg",
    status: "active" as const,
    start_date: "2025-02-01T15:00:00Z",
    end_time: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    highest_bidder_id: 300,
    highest_bidder_name: "Photo Pro",
    bid_count: 1,
    bids: [],
  };

  const liveHistory = {
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

  let auctionsFeed = [
    ...auctionList,
    {
      ...liveAuction,
      winning_user_name: liveAuction.highest_bidder_name,
    },
  ];
  let adminAuctions = [...auctionsFeed];
  let bidAttemptCount = 0;

  await page.route("**/api/v1/signup", (route) =>
    route.request().method() === "POST"
      ? fulfillJson(route, {
          user: demoUser,
          is_admin: false,
          is_superuser: false,
        })
      : route.continue(),
  );

  await page.route("**/api/v1/login", (route) =>
    route.request().method() === "POST"
      ? fulfillJson(route, {
          user: demoUser,
          is_admin: false,
          is_superuser: false,
        })
      : route.continue(),
  );

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionsFeed),
  );
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
  await page.route(
    `**/api/v1/auctions/${liveAuctionId}/bid_history`,
    (route) =>
      isDocumentRequest(route)
        ? route.continue()
        : fulfillJson(route, liveHistory),
  );
  await page.route(`**/api/v1/auctions/${liveAuctionId}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, liveAuction),
  );
  await page.route(`**/api/v1/auctions/${liveAuctionId}/bids`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bidAttemptCount += 1;
    if (bidAttemptCount === 1) {
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 6002,
          user_id: demoUser.id,
          username: demoUser.name,
          amount: 100,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 100 },
      });
    }
    return fulfillJson(route, { error: "Not enough bids" }, 400);
  });

  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );
  await page.route("**/api/v1/checkouts", (route) =>
    route.request().method() === "POST"
      ? fulfillJson(route, { clientSecret: "cs_demo_walkthrough" })
      : route.continue(),
  );
  await page.route("**/api/v1/checkout/success**", (route) =>
    fulfillJson(route, { status: "applied", purchaseId: "purchase_demo_1" }),
  );
  await page.route("**/api/v1/wallet", (route) =>
    fulfillJson(route, {
      credits_balance: creditsBalance,
      as_of: new Date().toISOString(),
      currency: "credits",
    }),
  );
  await page.route("**/api/v1/wallet/transactions**", (route) =>
    fulfillJson(route, {
      transactions: [
        {
          id: "ledger-1001",
          occurred_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          kind: "bid_pack_purchase",
          amount: 60,
          reason: "Starter Pack purchase",
          storefront_key: "main",
          purchase_url: "/account/purchases/501",
        },
        {
          id: "ledger-1002",
          occurred_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          kind: "bid_placed",
          amount: 1,
          reason: "Live auction bid",
          storefront_key: "main",
          auction_url: `/auctions/${liveAuctionId}`,
        },
      ],
      page: 1,
      per_page: 25,
      total_count: 2,
      has_more: false,
    }),
  );

  await page.route("**/api/v1/uploads", (route) =>
    fulfillJson(route, { url: "https://example.com/uploaded-demo.jpg" }),
  );
  await page.route("**/api/v1/admin/auctions", (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON() as { auction?: object };
      const auctionPayload = payload.auction ?? payload;
      const created = { id: 9090, ...(auctionPayload as object) };
      adminAuctions = [...adminAuctions, created];
      auctionsFeed = [
        ...auctionsFeed,
        created as (typeof auctionsFeed)[number],
      ];
      return fulfillJson(route, created);
    }
    return isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, adminAuctions);
  });

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Casey Bidder");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/auctions$/);
  await pause();

  setAuthOverride(page);
  setSessionOverride(page, { remaining_seconds: 1800 });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/auctions$/);
  setAuthOverride(page, demoUser);
  setSessionOverride(page, { remaining_seconds: 1800, user: demoUser });
  await pause();

  await page.getByTestId("auction-card-101").click();
  await expect(
    page.getByRole("heading", { name: "Vintage Camera" }),
  ).toBeVisible();
  await pause();

  await page.goto("/buy-bids");
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();
  await expect(page.locator("#checkout")).toBeVisible();
  await page.goto("/purchase-status?session_id=sess_demo_walkthrough");
  await expect(
    page.getByRole("heading", { name: "Purchase Complete" }),
  ).toBeVisible();
  await pause();

  await page.goto(`/auctions/${liveAuctionId}`);
  await expect(
    page.getByRole("heading", { name: "Studio Lights Bundle" }),
  ).toBeVisible();
  await page.waitForFunction(() => {
    // @ts-expect-error injected by setupMockCable
    return window.__cableSubscriptions?.size > 0;
  });

  const timerPanel = page.getByText("Time Remaining").locator("..");
  const timerBefore = (await timerPanel.textContent()) ?? "";

  await page.getByRole("button", { name: "Place Your Bid" }).click();
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    demoUser.name,
  );
  await pause();

  await pushCableMessage(page, {
    identifier: JSON.stringify({
      channel: "AuctionChannel",
      auction_id: liveAuctionId,
    }),
    message: {
      current_price: 110,
      highest_bidder_id: 501,
      highest_bidder_name: "Studio Ace",
      end_time: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
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
  await expect
    .poll(async () => (await timerPanel.textContent()) ?? "")
    .not.toBe(timerBefore);
  await pause();

  await page.getByRole("button", { name: "Place Your Bid" }).click();
  await expect(page.getByRole("alert")).toContainText("Not enough bids");
  await pause();

  await page.goto("/account/wallet");
  await expect(
    page.getByRole("heading", { name: "Bid History" }),
  ).toBeVisible();
  await expect(page.getByText("Bid pack purchase")).toBeVisible();
  await expect(page.getByText("+60.00 credits")).toBeVisible();
  await pause();

  setAuthOverride(page, adminSessionUser);
  setSessionOverride(page, {
    remaining_seconds: 1800,
    user: adminSessionUser,
  });
  await page.goto("/admin/auctions/new");
  await page.getByLabel("Upload image").setInputFiles({
    name: "auction.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  });
  await expect(page.getByText("Uploaded", { exact: true })).toBeVisible();
  await page.getByLabel("Title *").fill("Demo Drone Bundle");
  await page.getByLabel("Description").fill("Demo admin-created auction.");
  await page.getByLabel("Status").selectOption("scheduled");
  await page.getByLabel("Date").nth(0).fill("2025-06-01");
  await page.getByLabel("Time").nth(0).selectOption("12:00");
  await page.getByLabel("Date").nth(1).fill("2025-06-02");
  await page.getByLabel("Time").nth(1).selectOption("12:00");
  await page.getByRole("button", { name: "Create auction" }).click();
  await expect(page).toHaveURL("/admin/auctions");
  await expect(page.getByText("Demo Drone Bundle")).toBeVisible();
  await pause(1000);
});
