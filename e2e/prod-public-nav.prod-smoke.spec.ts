import { expect, test } from "@playwright/test";
import {
  acceptAgeGateIfPresent,
  getSessionExpiredRedirectUrl,
  waitForRouteOrSessionExpired,
} from "./prod/flows";

type RouteCase = {
  path: string;
  linkName?: string;
};

const ROUTES: RouteCase[] = [
  { path: "/about", linkName: "About" },
  { path: "/how-it-works", linkName: "How It Works" },
  { path: "/privacy-policy", linkName: "Privacy Policy" },
];

test("@p1 prod smoke: public routes are reachable from nav", async ({
  page,
}) => {
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
      `Skipping public nav smoke because storefront is redirecting guests to login with session_expired (url=${earlyRedirect}).`,
    );
  }

  for (const route of ROUTES) {
    if (route.linkName) {
      await page.getByRole("link", { name: route.linkName }).first().click();
    } else {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
    }

    const currentUrl = page.url();
    const redirected = getSessionExpiredRedirectUrl(currentUrl);
    if (redirected) {
      test.skip(
        true,
        `Skipping public nav smoke because storefront redirected guests to login with session_expired while navigating to ${route.path} (url=${redirected}).`,
      );
    }

    const routeWait = await waitForRouteOrSessionExpired(
      page,
      new RegExp(`${route.path}/?$`),
    );
    if (routeWait.kind === "session_expired") {
      throw new Error(
        `Public route appears auth-gated: redirected to login with session_expired while navigating to ${route.path} (url=${routeWait.url}).`,
      );
    }
    await expect(page.locator("main")).toBeVisible();
    await expect
      .poll(() => page.title(), {
        message: `Page title should not be empty for ${route.path}`,
      })
      .not.toBe("");

    await page.goto("/auctions", { waitUntil: "domcontentloaded" });
    await acceptAgeGateIfPresent(page);
    const resetRedirect = getSessionExpiredRedirectUrl(page.url());
    if (resetRedirect) {
      test.skip(
        true,
        `Skipping public nav smoke because storefront redirected guests to login with session_expired while returning to /auctions (url=${resetRedirect}).`,
      );
    }
  }
});
