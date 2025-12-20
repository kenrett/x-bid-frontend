import { expect, test } from "@playwright/test";
import {
  adminUser,
  auctionList,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("admin auction form validates required fields", async ({ page }) => {
  await seedAuthState(page, adminUser);
  await mockSessionRemaining(page, adminUser);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );
  await page.route("**/api/v1/admin/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/admin/auctions/new");
  await page.getByLabel("Title *").fill("   ");
  await page.getByRole("button", { name: "Create auction" }).click();
  await expect(page.getByText("Title is required.")).toBeVisible();
});

test("admin can create auction with schedule and image; shows on public feed", async ({
  page,
}) => {
  await seedAuthState(page, adminUser);
  await mockSessionRemaining(page, adminUser);

  let adminAuctions = [...auctionList];
  let createdPayload: unknown;

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, adminAuctions),
  );
  await page.route("**/api/v1/admin/auctions", (route) => {
    if (route.request().method() === "POST") {
      createdPayload = route.request().postDataJSON();
      const newAuction = {
        id: 9991,
        ...(createdPayload as object),
      };
      adminAuctions = [...adminAuctions, newAuction];
      return fulfillJson(route, newAuction);
    }
    return isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, adminAuctions);
  });

  await page.goto("/admin/auctions/new");
  await page.getByLabel("Title *").fill("Sunset Camera Bundle");
  await page
    .getByLabel("Description")
    .fill("Full-frame camera with two lenses.");
  await page.getByLabel("Image URL").fill("https://example.com/sunset.jpg");
  await page.getByLabel("Status").selectOption("scheduled");
  await page.getByLabel("Start Date").fill("2025-06-01T12:00:00Z");
  await page.getByLabel("End Time").fill("2025-06-02T12:00:00Z");
  await page.getByRole("button", { name: "Create auction" }).click();

  await expect(page).toHaveURL("/admin/auctions");
  await expect(page.getByText("Sunset Camera Bundle")).toBeVisible();

  expect(createdPayload).toMatchObject({
    title: "Sunset Camera Bundle",
    description: "Full-frame camera with two lenses.",
    image_url: "https://example.com/sunset.jpg",
    // scheduled converts to pending for API payload
    status: "pending",
    start_date: "2025-06-01T12:00:00Z",
    end_time: "2025-06-02T12:00:00Z",
  });

  // Public feed reflects the new auction.
  await page.goto("/auctions");
  await expect(page.getByText("Sunset Camera Bundle")).toBeVisible();
});

test("admin edits auction status/date and update appears on public feed", async ({
  page,
}) => {
  await seedAuthState(page, adminUser);
  await mockSessionRemaining(page, adminUser);

  const editableAuction = {
    id: 4040,
    title: "Mirrorless Kit",
    description: "Body + 24-70mm lens.",
    current_price: 999,
    image_url: "https://example.com/mirrorless.jpg",
    status: "active" as const,
    start_date: "2025-02-01T12:00:00Z",
    end_time: "2025-02-02T12:00:00Z",
    highest_bidder_id: null,
    winning_user_name: null,
    bid_count: 0,
  };

  let adminAuctions = [...auctionList, editableAuction];
  let capturedUpdate: unknown;

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, adminAuctions),
  );

  await page.route(`**/api/v1/auctions/${editableAuction.id}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, editableAuction),
  );

  await page.route(
    `**/api/v1/admin/auctions/${editableAuction.id}`,
    (route) => {
      if (route.request().method() === "PUT") {
        capturedUpdate = route.request().postDataJSON();
        adminAuctions = adminAuctions.map((auction) =>
          auction.id === editableAuction.id
            ? { ...auction, ...(capturedUpdate as object) }
            : auction,
        );
        return fulfillJson(route, {
          id: editableAuction.id,
          ...(capturedUpdate as object),
        });
      }
      return route.continue();
    },
  );

  // Auto-accept active edit confirmation
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/admin/auctions/${editableAuction.id}/edit`);
  await page.getByLabel("Status").selectOption("inactive");
  await page.getByLabel("End Time").fill("2025-02-03T12:00:00Z");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL("/admin/auctions");
  expect(capturedUpdate).toMatchObject({
    status: "inactive",
    end_time: "2025-02-03T12:00:00Z",
  });

  await page.goto("/auctions");
  await expect(page.getByText("Mirrorless Kit")).toBeVisible();
});
