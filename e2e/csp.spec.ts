import { expect, test } from "./fixtures/test";
import {
  auction101BidHistory,
  auctionDetail101,
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
} from "./fixtures/mocks";

test("no CSP console violations on key routes", async ({ page }) => {
  const violations: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Content-Security-Policy")) violations.push(text);
    if (text.includes("violates the following directive"))
      violations.push(text);
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await setupMockCable(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );
  await page.route("**/api/v1/auctions/3", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, {
          ...auctionDetail101,
          id: 3,
          title: "Marketplace Lamp",
        }),
  );
  await page.route("**/api/v1/auctions/3/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction101BidHistory),
  );

  const homeResponse = await page.goto("/");
  const cspHeader =
    homeResponse?.headers()["content-security-policy"] ??
    homeResponse?.headers()["Content-Security-Policy"];
  expect(cspHeader, "CSP header missing on homepage response").toBeTruthy();

  await expect(page.getByText("Your Next Obsession")).toBeVisible();

  await page.goto("/auctions/3");
  await expect(page.getByText("Marketplace Lamp")).toBeVisible();

  expect(
    [...pageErrors, ...violations],
    [...pageErrors, ...violations].length
      ? `Errors:\n${[...pageErrors, ...violations].join("\n")}`
      : undefined,
  ).toEqual([]);
});
