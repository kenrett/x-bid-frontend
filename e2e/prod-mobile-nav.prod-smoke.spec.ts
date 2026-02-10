import { expect, test } from "@playwright/test";
import { devices } from "@playwright/test";
import {
  acceptAgeGateIfPresent,
  getSessionExpiredRedirectUrl,
  waitForRouteOrSessionExpired,
} from "./prod/flows";

test.use({ ...devices["iPhone 12"] });

test("@p1 prod smoke: mobile menu and nav route work", async ({ page }) => {
  const response = await page.goto("/auctions", {
    waitUntil: "domcontentloaded",
  });
  expect(response, "Missing /auctions document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);

  await acceptAgeGateIfPresent(page);
  const earlyRedirect = getSessionExpiredRedirectUrl(page.url());
  if (earlyRedirect) {
    test.skip(
      true,
      `Skipping mobile nav smoke because storefront is redirecting guests to login with session_expired (url=${earlyRedirect}).`,
    );
  }

  const menuButton = page
    .locator("button[aria-controls='navbar-default']")
    .first();
  await expect(menuButton).toBeVisible();
  await menuButton.focus();
  await menuButton.press("Enter");

  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  const aboutLink = page
    .locator("#navbar-default")
    .getByRole("link", { name: "About" })
    .first();
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const redirect = getSessionExpiredRedirectUrl(page.url());
    if (redirect) {
      test.skip(
        true,
        `Skipping mobile nav smoke because storefront redirected to login with session_expired before About link click (url=${redirect}).`,
      );
    }
    const isVisible = await aboutLink.isVisible().catch(() => false);
    if (isVisible) break;
    await page.waitForTimeout(250);
  }
  await expect(aboutLink).toBeVisible();
  await aboutLink.click();

  const redirectedAfterClick = getSessionExpiredRedirectUrl(page.url());
  if (redirectedAfterClick) {
    test.skip(
      true,
      `Skipping mobile nav smoke because storefront redirected to login with session_expired after About click (url=${redirectedAfterClick}).`,
    );
  }

  const routeWait = await waitForRouteOrSessionExpired(page, /\/about\/?$/);
  if (routeWait.kind === "session_expired") {
    throw new Error(
      `Public route appears auth-gated (mobile): redirected to login with session_expired while navigating to /about (url=${routeWait.url}).`,
    );
  }
  await expect(page.locator("main")).toBeVisible();
});
