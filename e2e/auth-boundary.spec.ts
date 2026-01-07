import { expect, test, type Page } from "@playwright/test";
import {
  auction101BidHistory,
  auctionDetail101,
  auctionList,
  bidPacksResponse,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

const expectNoConsoleOrPageErrors = (page: Page) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const normalized = text.toLowerCase();
    const isExpectedHttpNoise =
      normalized.startsWith(
        "failed to load resource: the server responded with a status of",
      ) && /(401|403|503)/.test(normalized);
    if (isExpectedHttpNoise) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  return () => {
    const combined = [...consoleErrors, ...pageErrors];
    expect(
      combined,
      combined.length
        ? `Console/page errors:\n${combined.join("\n")}`
        : undefined,
    ).toEqual([]);
  };
};

test("403 email_unverified routes to verify screen with resend CTA", async ({
  page,
}) => {
  const assertNoErrors = expectNoConsoleOrPageErrors(page);
  await setupMockCable(page);

  const verifiedUser = {
    id: 88,
    name: "Casey Bidder",
    email: "casey@example.com",
    bidCredits: 120,
    is_admin: false,
    is_superuser: false,
    email_verified: true,
    email_verified_at: "2025-01-01T00:00:00Z",
  };

  await seedAuthState(page, verifiedUser);
  await mockSessionRemaining(page, verifiedUser);

  await page.route("**/api/v1/account/security", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          emailVerified: true,
          emailVerifiedAt: "2025-01-01T00:00:00Z",
        }),
  );

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );
  await page.route("**/api/v1/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail101),
  );
  await page.route("**/api/v1/auctions/101/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction101BidHistory),
  );

  let bidAttempts = 0;
  await page.route("**/api/v1/auctions/101/bids", (route) => {
    if (route.request().method() === "POST") {
      bidAttempts += 1;
      return fulfillJson(
        route,
        { error: "Email unverified", code: "email_unverified" },
        403,
      );
    }
    return route.continue();
  });

  await page.goto("/auctions/101");
  await page.getByRole("button", { name: "Place Your Bid" }).click();

  await expect(page).toHaveURL(
    /\/account\/verify-email\?reason=email_unverified/,
  );
  await expect(page.getByTestId("email-unverified-banner")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /resend email/i }),
  ).toBeVisible();
  expect(bidAttempts).toBe(1);

  assertNoErrors();
});

test("401 invalid_session logs out and redirects to login with next param (no refresh loop)", async ({
  page,
}) => {
  const assertNoErrors = expectNoConsoleOrPageErrors(page);
  await setupMockCable(page);
  await stubStripe(page);

  const verifiedUser = {
    id: 88,
    name: "Casey Bidder",
    email: "casey@example.com",
    bidCredits: 120,
    is_admin: false,
    is_superuser: false,
    email_verified: true,
    email_verified_at: "2025-01-01T00:00:00Z",
  };

  await seedAuthState(page, verifiedUser);
  await mockSessionRemaining(page, verifiedUser);

  await page.route("**/api/v1/account/security", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          emailVerified: true,
          emailVerifiedAt: "2025-01-01T00:00:00Z",
        }),
  );

  await page.route("**/api/v1/bid_packs", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, bidPacksResponse),
  );

  let refreshCalls = 0;
  await page.route("**/api/v1/session/refresh", (route) => {
    refreshCalls += 1;
    return fulfillJson(route, { error: "should not refresh" }, 500);
  });

  await page.route("**/api/v1/checkouts", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(
          route,
          { error: "Session invalid", code: "invalid_session" },
          401,
        ),
  );

  await page.goto("/buy-bids");
  await expect(
    page.getByRole("heading", { name: /arm yourself/i }),
  ).toBeVisible();

  const acquireButton = page
    .getByRole("button", { name: "Acquire Pack" })
    .first();
  await acquireButton.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(/\/login\?next=/),
    acquireButton.click({ force: true }),
  ]);

  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    /session expired/i,
  );
  expect(refreshCalls).toBe(0);

  const hasSession = await page.evaluate(() =>
    Boolean(localStorage.getItem("auth.session.v1")),
  );
  expect(hasSession).toBe(false);

  assertNoErrors();
});

test("503 maintenance_mode routes to /maintenance from account export", async ({
  page,
}) => {
  const assertNoErrors = expectNoConsoleOrPageErrors(page);
  await setupMockCable(page);

  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/account/security", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          emailVerified: true,
          emailVerifiedAt: "2025-01-01T00:00:00Z",
        }),
  );

  await page.route("**/api/v1/account/data/export", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : route.fulfill({
          status: 200,
          headers: {
            "content-type": "application/json",
            "X-Maintenance": "true",
          },
          body: JSON.stringify({ status: "pending" }),
        }),
  );
  await page.route("**/api/v1/maintenance", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          maintenance: { enabled: true, updated_at: null },
        }),
  );

  await page.goto("/account/data/export");
  await expect(page).toHaveURL(/\/maintenance$/);
  await expect(
    page.getByRole("heading", {
      name: /backstage action is happening/i,
    }),
  ).toBeVisible();

  assertNoErrors();
});
