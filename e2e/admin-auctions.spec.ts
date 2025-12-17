import { expect, test } from "@playwright/test";
import {
  adminUser,
  auctionList,
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

test("admin can create and edit an auction", async ({ page }) => {
  await seedAuthState(page, adminUser);
  await mockSessionRemaining(page, adminUser);

  let auctionsPayload = auctionList;
  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionsPayload),
  );

  let capturedCreate: unknown;
  await page.route("**/api/v1/admin/auctions", (route) => {
    if (route.request().method() === "POST") {
      capturedCreate = route.request().postDataJSON();
      auctionsPayload = [
        ...auctionsPayload,
        {
          id: 303,
          ...(capturedCreate as object),
        },
      ];
      return fulfillJson(route, { id: 303, ...(capturedCreate as object) });
    }
    return route.continue();
  });

  await page.goto("/admin/auctions/new");

  await page.getByLabel("Title *").fill("Sunrise Drone");
  await page.getByLabel("Status").selectOption("scheduled");
  await page
    .getByLabel("Description")
    .fill("Ultra-light drone for sunrise shoots.");
  await page.getByRole("button", { name: "Create auction" }).click();

  await expect(page).toHaveURL("/admin/auctions");
  await expect(page.getByText("Sunrise Drone")).toBeVisible();
  expect(capturedCreate).toMatchObject({
    title: "Sunrise Drone",
  });

  const editableAuction = {
    id: 404,
    title: "Mirrorless Camera Kit",
    description: "Body + 24-70mm lens.",
    current_price: 999,
    image_url: "",
    status: "active" as const,
    start_date: "2025-02-01T12:00:00Z",
    end_time: "2025-02-02T12:00:00Z",
    highest_bidder_id: null,
    winning_user_name: null,
    bid_count: 0,
  };

  auctionsPayload = [...auctionsPayload, editableAuction];

  await page.route(`**/api/v1/auctions/${editableAuction.id}`, (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, editableAuction),
  );

  let capturedUpdate: unknown;
  await page.route(
    `**/api/v1/admin/auctions/${editableAuction.id}`,
    (route) => {
      if (route.request().method() === "PUT") {
        capturedUpdate = route.request().postDataJSON();
        auctionsPayload = auctionsPayload.map((auction) =>
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

  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`/admin/auctions/${editableAuction.id}/edit`);
  await page.getByLabel("Title *").fill("Mirrorless Camera Kit (Updated)");
  await page.getByLabel("Status").selectOption("scheduled");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL("/admin/auctions");
  await expect(page.getByText("Mirrorless Camera Kit (Updated)")).toBeVisible();
  expect(capturedUpdate).toMatchObject({
    title: "Mirrorless Camera Kit (Updated)",
  });
});
