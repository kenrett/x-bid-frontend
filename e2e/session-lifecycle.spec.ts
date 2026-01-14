import { expect, test } from "@playwright/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("session polling updates in-memory session", async ({ page }) => {
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
      user: { id: 88, name: "Casey Bidder", email: "casey@example.com" },
    });
    // @ts-expect-error test-only marker
    return window.__lastSessionState;
  });

  expect(refreshed).toMatchObject({
    user: { email: "casey@example.com" },
  });

  const stored = await page.evaluate(() => ({
    legacyToken: localStorage.getItem("token"),
    session: localStorage.getItem("auth.session.v1"),
  }));
  expect(stored.legacyToken).toBeNull();
  expect(stored.session).toBeNull();
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
  await page.evaluate(async () => {
    // @ts-expect-error test-only hook set in AuthProvider when VITE_E2E_TESTS=true
    await window.__triggerSessionPoll?.({ remaining_seconds: 0 });
  });

  await page.waitForFunction(
    () =>
      // @ts-expect-error test-only marker
      window.__lastSessionState?.loggedOut === true &&
      localStorage.getItem("auth.session.v1") === null,
  );

  const loggedOut = await page.evaluate(() => ({
    session: localStorage.getItem("auth.session.v1"),
    // @ts-expect-error test-only marker
    state: window.__lastSessionState,
  }));

  expect(loggedOut.session).toBeNull();
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
    session: localStorage.getItem("auth.session.v1"),
  }));
  expect(stored.session).toBeNull();
});
