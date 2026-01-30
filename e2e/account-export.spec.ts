import { expect, test } from "./fixtures/test";
import {
  fulfillJson,
  isDocumentRequest,
  mockSessionRemaining,
  seedAuthState,
  setupMockCable,
} from "./fixtures/mocks";

test("account export stays pending before completing", async ({ page }) => {
  await setupMockCable(page);
  await seedAuthState(page);
  await mockSessionRemaining(page);

  let statusCalls = 0;
  await page.route("**/api/v1/account/data/export", (route) => {
    if (isDocumentRequest(route)) return route.continue();
    const method = route.request().method();
    if (method === "POST") {
      return fulfillJson(route, { status: "pending" });
    }
    if (method === "GET") {
      statusCalls += 1;
      if (statusCalls < 3) {
        return fulfillJson(route, { status: "pending" });
      }
      return fulfillJson(route, {
        status: "ready",
        downloadUrl: "https://example.com/export.json",
      });
    }
    return route.continue();
  });

  await page.goto("/account/data/export");
  await expect(
    page.getByRole("heading", { name: /export your data/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Export data" }).click();
  await expect(page.getByText(/status:\s*pending/i)).toBeVisible();

  await expect(page.getByRole("button", { name: "Download JSON" })).toBeVisible(
    { timeout: 15_000 },
  );
});
