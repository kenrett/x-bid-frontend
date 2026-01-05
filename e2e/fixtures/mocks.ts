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

export const adminUser = {
  ...authedUser,
  id: 999,
  name: "Ada Admin",
  email: "ada@example.com",
  is_admin: true,
  is_superuser: true,
};

export const loginResponse = {
  access_token: "token-login",
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

export const mockSessionRemaining = async (page: Page, user = authedUser) => {
  await page.route("**/api/v1/session/remaining", (route) =>
    fulfillJson(route, {
      remaining_seconds: 1800,
      access_token: "token-authed",
      refresh_token: "refresh-authed",
      session_token_id: "session-authed",
      user,
    }),
  );
};

export const stubStripe = async (page: Page) => {
  const stripeStub = `
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
      // Provide a fast path for tests that look for __mockStripePromise when VITE_E2E_TESTS is true.
      // @ts-expect-error test-only hook
      window.__mockStripePromise = Promise.resolve(Stripe());
    })();
  `;

  await page.context().route("**/js.stripe.com/v3**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: stripeStub,
    }),
  );
};

export const setupMockCable = async (page: Page) => {
  await page.addInitScript(() => {
    // Track active subscription identifiers for tests to wait on
    // @ts-expect-error test-only global
    const subscriptionSet: Set<string> = new Set();
    // @ts-expect-error expose for tests
    window.__cableSubscriptions = subscriptionSet;

    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      static sockets: MockWebSocket[] = [];
      readyState = MockWebSocket.CONNECTING;
      subscriptions = new Set<string>();
      onopen: ((event: unknown) => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onclose: ((event: unknown) => void) | null = null;
      constructor(public url: string) {
        MockWebSocket.sockets.push(this);
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.({});
          this.onmessage?.({ data: JSON.stringify({ type: "welcome" }) });
        }, 0);
      }
      send(data: string) {
        try {
          const parsed = JSON.parse(data) as {
            command?: string;
            identifier?: string;
          };
          if (parsed.command === "subscribe" && parsed.identifier) {
            this.subscriptions.add(parsed.identifier);
            subscriptionSet.add(parsed.identifier);
            setTimeout(() => {
              this.onmessage?.(
                this.buildMessage({
                  type: "confirm_subscription",
                  identifier: parsed.identifier,
                }),
              );
            }, 0);
          }
        } catch {
          // ignore malformed data
        }
      }
      buildMessage(payload: unknown) {
        return { data: JSON.stringify(payload) };
      }
      close() {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({});
      }
      static push(payload: unknown) {
        for (const socket of MockWebSocket.sockets) {
          const identifier = (payload as { identifier?: string }).identifier;
          if (!identifier || socket.subscriptions.has(identifier)) {
            socket.onmessage?.(
              socket.buildMessage(
                payload as {
                  identifier?: string;
                  message?: unknown;
                },
              ),
            );
          }
        }
      }
    }
    // @ts-expect-error override for tests
    window.WebSocket = MockWebSocket;
    // @ts-expect-error helper for tests
    window.__pushCableMessage = (payload: unknown) =>
      MockWebSocket.push(payload);
  });
  // Provide a mock consumer that bypasses the real ActionCable transport.
  await page.addInitScript(() => {
    // @ts-expect-error test-only injection for services/cable
    window.__mockCreateConsumer = () => {
      // console.log("[mock cable] createConsumer", url);
      return {
        subscriptions: {
          create(identifier: unknown, callbacks: Record<string, () => void>) {
            const id =
              typeof identifier === "string"
                ? identifier
                : JSON.stringify(identifier);
            // Immediately treat the subscription as confirmed
            // @ts-expect-error shared test-only global
            window.__cableSubscriptions?.add(id);
            // @ts-expect-error shared helper
            window.__mockCableRegister?.(id, callbacks);
            callbacks?.connected?.();
            return {
              identifier: id,
              perform: () => {},
              send: () => {},
              unsubscribe: () => {
                // @ts-expect-error shared test-only global
                window.__cableSubscriptions?.delete(id);
                // @ts-expect-error shared helper
                window.__mockCableUnregister?.(id);
                callbacks?.disconnected?.();
              },
            };
          },
        },
        disconnect: () => {},
      };
    };
  });
  await page.addInitScript(() => {
    // Register/unregister handlers for the consumer mock.
    type CallbackEntry = {
      received?: (payload: unknown) => void;
      connected?: () => void;
      disconnected?: () => void;
    };
    const cbMap =
      // @ts-expect-error shared map populated earlier
      (window.__mockCableCallbacks as Map<string, CallbackEntry>) ??
      // @ts-expect-error create once
      (window.__mockCableCallbacks = new Map());
    // @ts-expect-error expose register/unregister helpers
    window.__mockCableRegister = (
      id: string,
      callbacks?: Record<string, () => void>,
    ) => {
      cbMap.set(id, {
        received: callbacks?.received as
          | ((payload: unknown) => void)
          | undefined,
        connected: callbacks?.connected as (() => void) | undefined,
        disconnected: callbacks?.disconnected as (() => void) | undefined,
      });
    };
    // @ts-expect-error expose helper
    window.__mockCableUnregister = (id: string) => cbMap.delete(id);
    // @ts-expect-error expose helper to change connection state
    window.__mockCableSetState = (
      id: string,
      state: "connected" | "disconnected",
    ) => {
      const entry = cbMap.get(id);
      if (!entry) return;
      if (state === "connected") entry.connected?.();
      else entry.disconnected?.();
    };
    // @ts-expect-error share for delivery helper
    window.__mockCableDeliver = (payload: {
      identifier?: string;
      message?: unknown;
    }) => {
      const { identifier, message } = payload ?? {};
      if (identifier) {
        cbMap.get(identifier)?.received?.(message ?? payload);
        return;
      }
      cbMap.forEach((cb) => cb.received?.(message ?? payload));
    };
  });
};

export const pushCableMessage = async (page: Page, payload: unknown) => {
  await page.evaluate((message) => {
    // @ts-expect-error support consumer mock delivery
    if (window.__mockCableDeliver) {
      // @ts-expect-error helper for tests
      window.__mockCableDeliver(message);
      return;
    }
    // @ts-expect-error injected helper
    window.__pushCableMessage?.(message);
  }, payload);
};
