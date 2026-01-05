import { expect, test } from "@playwright/test";
import {
  auctionList,
  authedUser,
  fulfillJson,
  isDocumentRequest,
  loginResponse,
  mockSessionRemaining,
} from "./fixtures/mocks";

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
