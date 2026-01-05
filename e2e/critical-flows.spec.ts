import { expect, test, type Page, type Route } from "@playwright/test";

const placeholderImage =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const auctionList = [
  {
    id: 101,
    title: "Vintage Camera",
    description: "Classic film camera ready for a second life.",
    current_price: 125,
    image_url: placeholderImage,
    status: "active" as const,
    start_date: "2025-02-01T12:00:00Z",
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    highest_bidder_id: 7,
    winning_user_name: "Mason Wolfe",
    bid_count: 4,
  },
  {
    id: 202,
    title: "Noise-Cancelling Headphones",
    description: "Studio-grade silence with long battery life.",
    current_price: 240,
    image_url: placeholderImage,
    status: "scheduled" as const,
    start_date: "2025-02-02T12:00:00Z",
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    highest_bidder_id: null,
    winning_user_name: null,
    bid_count: 0,
  },
];

const auctionDetail101 = { ...auctionList[0], bids: [] };

const auction101BidHistory = {
  auction: {
    winning_user_id: 7,
    winning_user_name: "Mason Wolfe",
  },
  bids: [
    {
      id: 5001,
      user_id: 7,
      username: "Mason Wolfe",
      amount: 125,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 5000,
      user_id: 6,
      username: "Jordan Glass",
      amount: 120,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
};

const authedUser = {
  id: 88,
  name: "Casey Bidder",
  email: "casey@example.com",
  bidCredits: 120,
  is_admin: false,
  is_superuser: false,
  email_verified: true,
  email_verified_at: "2025-01-01T00:00:00Z",
};

const loginResponse = {
  access_token: "token-login",
  refresh_token: "refresh-login",
  session_token_id: "session-login",
  user: authedUser,
  is_admin: false,
  is_superuser: false,
};

const auctionDetail501 = {
  id: 501,
  title: "Carbon Fiber eBike",
  description: "Light commuter with stealth motor assist.",
  current_price: 142.5,
  image_url: placeholderImage,
  status: "active" as const,
  start_date: "2025-02-01T14:00:00Z",
  end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  highest_bidder_id: 77,
  winning_user_name: "Early Bird",
  bid_count: 3,
  bids: [],
};

const auction501BidHistory = {
  auction: {
    winning_user_id: 77,
    winning_user_name: "Early Bird",
  },
  bids: [
    {
      id: 9001,
      user_id: 77,
      username: "Early Bird",
      amount: 142.5,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 8999,
      user_id: 45,
      username: "Gadget Hawk",
      amount: 130,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
};

const bidPacksResponse = [
  {
    id: 1,
    name: "Starter Pack",
    description: "Warm up with a handful of bids.",
    bids: 50,
    price: 19.99,
    pricePerBid: "0.40",
    highlight: false,
    status: "active" as const,
    active: true,
  },
  {
    id: 2,
    name: "Pro Pack",
    description: "More fuel for competitive auctions.",
    bids: 260,
    price: 79.99,
    pricePerBid: "0.31",
    highlight: true,
    status: "active" as const,
    active: true,
  },
];

const fulfillJson = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });

const isDocumentRequest = (route: Route) =>
  route.request().resourceType() === "document";

const seedAuthState = async (page: Page, user = authedUser) => {
  await page.addInitScript(
    (auth) => {
      localStorage.setItem("auth.session.v1", JSON.stringify(auth));
    },
    {
      user,
      access_token: "token-authed",
      refresh_token: "refresh-authed",
      session_token_id: "session-authed",
    },
  );
};

const mockSessionRemaining = async (page: Page, user = authedUser) => {
  await page.route("**/session/remaining", (route) =>
    fulfillJson(route, {
      remaining_seconds: 1800,
      access_token: "token-authed",
      refresh_token: "refresh-authed",
      session_token_id: "session-authed",
      user,
    }),
  );
};

const stubStripe = async (page: Page) => {
  await page.context().route("https://js.stripe.com/v3", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        (() => {
          function createCheckout() {
            return {
              mount: () => {},
              unmount: () => {},
              setClientSecret: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
            };
          }
          const Stripe = () => ({
            elements: () => ({ create: () => ({ mount() {}, destroy() {} }) }),
            initEmbeddedCheckout: () => Promise.resolve(createCheckout()),
          });
          Stripe.setLoadParameters = () => {};
          window.Stripe = Stripe;
        })();
      `,
    }),
  );
};

test("guest can browse auctions and open a detail page", async ({ page }) => {
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
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

  await page.goto("/auctions");

  await expect(
    page.getByRole("heading", { name: "Your Next Obsession" }),
  ).toBeVisible();
  await expect(page.getByTestId("auction-card-101")).toContainText(
    "Vintage Camera",
  );
  await page.getByTestId("auction-card-101").click();

  await expect(page).toHaveURL(/\/auctions\/101$/);
  await expect(
    page.getByRole("heading", { name: "Vintage Camera" }),
  ).toBeVisible();
  await expect(
    page.locator("#current-price-label").locator(".."),
  ).toContainText("$125.00");
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Mason Wolfe",
  );
});

test("user can log in and land on the auctions feed", async ({ page }) => {
  await page.route("**/api/v1/login", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, loginResponse),
  );
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );
  await mockSessionRemaining(page);

  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/auctions$/);
  await expect(page.getByText(authedUser.email)).toBeVisible();
  await expect(page.getByText(`${authedUser.bidCredits} Bids`)).toBeVisible();

  const state = await page.evaluate(() => {
    // @ts-expect-error test-only marker
    return window.__lastSessionState;
  });
  expect(state).toMatchObject({
    accessToken: loginResponse.access_token,
    refreshToken: loginResponse.refresh_token,
    sessionTokenId: loginResponse.session_token_id,
  });

  const stored = await page.evaluate(() => ({
    legacyToken: localStorage.getItem("token"),
    session: localStorage.getItem("auth.session.v1"),
  }));
  expect(stored.legacyToken).toBeNull();
  expect(JSON.parse(stored.session as string)).toMatchObject({
    access_token: loginResponse.access_token,
    refresh_token: loginResponse.refresh_token,
    session_token_id: loginResponse.session_token_id,
    user: { email: authedUser.email },
  });
});

test("authenticated user can place a bid on an active auction", async ({
  page,
}) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions/501/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction501BidHistory),
  );
  await page.route("**/api/v1/auctions/501/bids", (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 9002,
          user_id: authedUser.id,
          username: authedUser.name,
          amount: 150,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 150 },
      });
    }
    return route.continue();
  });
  await page.route("**/api/v1/auctions/501", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail501),
  );

  await page.goto("/auctions/501");

  await expect(
    page.getByRole("heading", { name: "Carbon Fiber eBike" }),
  ).toBeVisible();
  const bidButton = page.getByRole("button", { name: "Place Your Bid" });
  await expect(bidButton).toBeEnabled();

  await bidButton.click();

  await expect(
    page.getByRole("button", { name: "You are the highest bidder" }),
  ).toBeDisabled();
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    authedUser.name,
  );
  await expect(page.getByLabel("Current Price")).toHaveText("$150.00");
  await expect(page.getByText(`${authedUser.name} bid $150.00`)).toBeVisible();
});

test("authenticated user can start a bid pack checkout", async ({ page }) => {
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
      return fulfillJson(route, { clientSecret: "cs_test_fake" });
    }
    return route.continue();
  });

  await page.goto("/buy-bids");

  await expect(
    page.getByRole("heading", { name: "Starter Pack" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Acquire Pack" }).first().click();

  await expect(page.locator("#checkout")).toBeVisible();
});
