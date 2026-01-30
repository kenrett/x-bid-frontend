import { expect, test } from "./fixtures/test";
import {
  auctionList,
  authedUser,
  fulfillJson,
  isDocumentRequest,
  loginResponse,
  mockSessionRemaining,
} from "./fixtures/mocks";

const buildStorefrontUrl = (base: string, subdomain: string) => {
  const url = new URL(base);
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
    url.hostname = `${subdomain}.localhost`;
  } else {
    url.hostname = `${subdomain}.${url.hostname}`;
  }
  return url.toString().replace(/\/+$/, "");
};

test("user can log in and land on the auctions feed", async ({ page }) => {
  let auctionsAuthHeader: string | undefined;
  await page.route("**/api/v1/login", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, loginResponse),
  );
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : ((auctionsAuthHeader = route.request().headers()["authorization"]),
        fulfillJson(route, auctionList)),
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
    user: { email: authedUser.email },
  });
  expect(auctionsAuthHeader).toBeUndefined();

  const stored = await page.evaluate(() => ({
    legacyToken: localStorage.getItem("token"),
    session: localStorage.getItem("auth.session.v1"),
  }));
  expect(stored.legacyToken).toBeNull();
  expect(stored.session).toBeNull();
});

test("login persists across storefront subdomains", async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
  const hostname = new URL(base).hostname;
  test.skip(
    hostname === "localhost" || hostname === "127.0.0.1",
    "SSO cookies are not supported on localhost subdomains.",
  );
  const afterdarkBase = buildStorefrontUrl(base, "afterdark");

  await page.route("**/api/v1/login", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, loginResponse),
  );
  let loggedInAuthHeader: string | undefined;
  await page.route("**/api/v1/logged_in", (route) =>
    fulfillJson(
      route,
      ((loggedInAuthHeader = route.request().headers()["authorization"]),
      {
        logged_in: true,
        user: authedUser,
        is_admin: false,
        is_superuser: false,
      }),
    ),
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

  await expect(page.getByText(authedUser.email)).toBeVisible();

  await page.goto(new URL("/auctions", afterdarkBase).toString());
  await expect(page.getByText(authedUser.email)).toBeVisible();
  expect(loggedInAuthHeader).toBeUndefined();
});
