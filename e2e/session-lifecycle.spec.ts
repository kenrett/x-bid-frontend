import { expect, test } from "@playwright/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("session token refresh updates in-memory session", async ({ page }) => {
  await seedAuthState(page);
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/auctions");
  await page.waitForFunction(
    () =>
      // @ts-expect-error test-only hook set in AuthProvider when VITE_E2E_TESTS=true
      typeof window.__triggerSessionPoll === "function",
  );
  const refreshed = await page.evaluate(async () => {
    // @ts-expect-error test-only hook set in AuthProvider when VITE_E2E_TESTS=true
    await window.__triggerSessionPoll?.({
      remaining_seconds: 1200,
      token: "token-refreshed",
      refresh_token: "refresh-refreshed",
      session_token_id: "session-refreshed",
      user: { id: 88, name: "Casey Bidder", email: "casey@example.com" },
    });
    // @ts-expect-error test-only marker
    return window.__lastSessionState;
  });

  expect(refreshed).toMatchObject({
    token: "token-refreshed",
    refreshToken: "refresh-refreshed",
    sessionTokenId: "session-refreshed",
  });

  const stored = await page.evaluate(() => ({
    token: localStorage.getItem("token"),
    refresh: localStorage.getItem("refreshToken"),
    sessionId: localStorage.getItem("sessionTokenId"),
    user: localStorage.getItem("user"),
  }));
  expect(stored.token).toBeNull();
  expect(stored.refresh).toBeNull();
  expect(stored.sessionId).toBeNull();
  expect(stored.user).toBeNull();
});

test("session expiration logs out", async ({ page }) => {
  await seedAuthState(page);

  await page.route("**/api/v1/session/remaining", (route) =>
    fulfillJson(route, { remaining_seconds: 0 }),
  );
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/auctions");
  await page.waitForFunction(
    () =>
      // @ts-expect-error test-only hook set in AuthProvider when VITE_E2E_TESTS=true
      typeof window.__triggerSessionPoll === "function",
  );
  const loggedOut = await page.evaluate(async () => {
    // @ts-expect-error test-only hook set in AuthProvider when VITE_E2E_TESTS=true
    await window.__triggerSessionPoll?.({ remaining_seconds: 0 });
    return {
      token: localStorage.getItem("token"),
      user: localStorage.getItem("user"),
      // @ts-expect-error test-only marker
      state: window.__lastSessionState,
    };
  });

  expect(loggedOut.token).toBeNull();
  expect(loggedOut.user).toBeNull();
  expect(loggedOut.state).toMatchObject({ loggedOut: true });
});

test("manual logout clears storage", async ({ page }) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/auctions");
  await page.getByRole("button", { name: "Log Out" }).click();

  const stored = await page.evaluate(() => ({
    token: localStorage.getItem("token"),
    user: localStorage.getItem("user"),
  }));
  expect(stored.token).toBeNull();
  expect(stored.user).toBeNull();
});
