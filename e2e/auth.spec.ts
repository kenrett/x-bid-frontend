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
  await page.route("**/login", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, loginResponse),
  );
  await page.route("**/auctions", (route) => {
    if (isDocumentRequest(route)) return route.continue();
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/auctions") {
      return fulfillJson(route, auctionList);
    }
    return route.continue();
  });
  await mockSessionRemaining(page);

  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/auctions$/);
  await expect(page.getByText(authedUser.email)).toBeVisible();
  await expect(page.getByText(`${authedUser.bidCredits} Bids`)).toBeVisible();

  const stored = await page.evaluate(() => ({
    token: localStorage.getItem("token"),
    refresh: localStorage.getItem("refreshToken"),
    sessionId: localStorage.getItem("sessionTokenId"),
    user: localStorage.getItem("user"),
  }));
  expect(stored.token).toBe(loginResponse.token);
  expect(stored.refresh).toBe(loginResponse.refresh_token);
  expect(stored.sessionId).toBe(loginResponse.session_token_id);
  expect(stored.user).toContain(authedUser.email);
});
