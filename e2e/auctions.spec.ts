import { expect, test } from "@playwright/test";
import {
  auction101BidHistory,
  auction501BidHistory,
  auctionDetail101,
  auctionDetail501,
  auctionList,
  authedUser,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("guest can browse auctions and open a detail page", async ({ page }) => {
  await page.route("**/auctions", (route) => {
    if (isDocumentRequest(route)) return route.continue();
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/auctions") {
      return fulfillJson(route, auctionList);
    }
    return route.continue();
  });

  await page.route("**/auctions/101/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction101BidHistory),
  );
  await page.route("**/auctions/101", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail101),
  );

  await page.goto("/auctions");

  await expect(
    page.getByRole("heading", { name: "Your Next Obsession" }),
  ).toBeVisible();
  await expect(page.getByTestId("auction-card-101")).toContainText(
    "Vintage Camera",
  );
  await page.getByTestId("auction-card-101").click();

  await expect(page).toHaveURL(/\/auctions\/101$/);
  await expect(
    page.getByRole("heading", { name: "Vintage Camera" }),
  ).toBeVisible();
  await expect(
    page.locator("#current-price-label").locator(".."),
  ).toContainText("$125.00");
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    "Mason Wolfe",
  );
});

test("authenticated user can place a bid on an active auction", async ({
  page,
}) => {
  await seedAuthState(page);
  await mockSessionRemaining(page);

  await page.route("**/auctions/501/bid_history", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auction501BidHistory),
  );
  await page.route("**/auctions/501/bids", (route) => {
    if (route.request().method() === "POST") {
      return fulfillJson(route, {
        success: true,
        bid: {
          id: 9002,
          user_id: authedUser.id,
          username: authedUser.name,
          amount: 150,
          created_at: new Date().toISOString(),
        },
        auction: { current_price: 150 },
      });
    }
    return route.continue();
  });
  await page.route("**/auctions/501", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionDetail501),
  );

  await page.goto("/auctions/501");

  await expect(
    page.getByRole("heading", { name: "Carbon Fiber eBike" }),
  ).toBeVisible();
  const bidButton = page.getByRole("button", { name: "Place Your Bid" });
  await expect(bidButton).toBeEnabled();

  await bidButton.click();

  await expect(
    page.getByRole("button", { name: "You are the highest bidder" }),
  ).toBeDisabled();
  await expect(page.getByTestId("highest-bidder-info")).toContainText(
    authedUser.name,
  );
  await expect(page.getByLabel("Current Price")).toHaveText("$150.00");
  await expect(page.getByText(`${authedUser.name} bid $150.00`)).toBeVisible();
});
