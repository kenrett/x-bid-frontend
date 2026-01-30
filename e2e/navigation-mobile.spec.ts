import { expect, test, devices } from "./fixtures/test";
import { fulfillJson, isDocumentRequest } from "./fixtures/mocks";

test("header and footer links navigate", async ({ page }) => {
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/auctions");

  await page.getByRole("link", { name: "How It Works" }).click();
  await expect(page).toHaveURL(/\/how-it-works/);

  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about/);

  await page.getByRole("link", { name: "Buy Bids" }).click();
  await expect(page).toHaveURL(/\/buy-bids/);

  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy-policy/);
});

test.use({ ...devices["iPhone 12"] });

test("mobile can browse auctions and open detail", async ({ page }) => {
  const auction = {
    id: 7777,
    title: "Mobile Tripod",
    description: "Compact and stable.",
    current_price: 42,
    image_url:
      "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    status: "active" as const,
    start_date: "2025-02-01T12:00:00Z",
    end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    highest_bidder_id: 1,
    winning_user_name: "Alex",
    bid_count: 2,
  };

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, [auction]),
  );
  await page.route("**/api/v1/auctions/7777", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { ...auction, bids: [] }),
  );
  await page.route("**/api/v1/auctions/7777/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, { auction: {}, bids: [] }),
  );

  await page.goto("/auctions");

  await expect(page.getByText("Your Next Obsession")).toBeVisible();
  await page.getByText("Mobile Tripod").click();
  await expect(page).toHaveURL(/\/auctions\/7777$/);
  await expect(
    page.getByRole("heading", { name: "Mobile Tripod" }),
  ).toBeVisible();
});
