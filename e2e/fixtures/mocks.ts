import type { Page, Route } from "@playwright/test";

export const placeholderImage =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export const auctionList = [
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

export const auctionDetail101 = { ...auctionList[0], bids: [] };

export const auction101BidHistory = {
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

export const authedUser = {
  id: 88,
  name: "Casey Bidder",
  email: "casey@example.com",
  bidCredits: 120,
  is_admin: false,
  is_superuser: false,
};

export const loginResponse = {
  token: "token-login",
  refresh_token: "refresh-login",
  session_token_id: "session-login",
  user: authedUser,
  is_admin: false,
  is_superuser: false,
};

export const auctionDetail501 = {
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

export const auction501BidHistory = {
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

export const bidPacksResponse = [
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

export const fulfillJson = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });

export const isDocumentRequest = (route: Route) =>
  route.request().resourceType() === "document";

export const seedAuthState = async (page: Page, user = authedUser) => {
  await page.addInitScript(
    (auth) => {
      localStorage.setItem("user", JSON.stringify(auth.user));
      localStorage.setItem("token", auth.token);
      localStorage.setItem("refreshToken", auth.refreshToken);
      localStorage.setItem("sessionTokenId", auth.sessionTokenId);
    },
    {
      user,
      token: "token-authed",
      refreshToken: "refresh-authed",
      sessionTokenId: "session-authed",
    },
  );
};

export const mockSessionRemaining = async (page: Page, user = authedUser) => {
  await page.route("**/session/remaining", (route) =>
    fulfillJson(route, {
      remaining_seconds: 1800,
      token: "token-authed",
      refresh_token: "refresh-authed",
      session_token_id: "session-authed",
      user,
    }),
  );
};

export const stubStripe = async (page: Page) => {
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
