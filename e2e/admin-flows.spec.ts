import { expect, test } from "./fixtures/test";
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
      const requestPayload = route.request().postDataJSON() as {
        auction?: object;
      };
      createdPayload = requestPayload.auction ?? requestPayload;
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
  await page
    .locator('label:has-text("Status") select')
    .selectOption("scheduled");
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

test("admin can retry image upload", async ({ page }) => {
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

  let uploadAttempts = 0;
  await page.route("**/api/v1/uploads", (route) => {
    uploadAttempts += 1;
    if (uploadAttempts === 1) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Upload failed" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://example.com/uploaded.jpg" }),
    });
  });

  await page.goto("/admin/auctions/new");
  await page.getByLabel("Upload image").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  });

  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();

  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByText("Uploaded", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Image URL")).toHaveValue(
    "https://example.com/uploaded.jpg",
  );
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
        const requestPayload = route.request().postDataJSON() as {
          auction?: object;
        };
        capturedUpdate = requestPayload.auction ?? requestPayload;
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
  await page
    .locator('label:has-text("Status") select')
    .selectOption("inactive");
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
