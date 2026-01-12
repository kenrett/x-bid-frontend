import { expect, test } from "@playwright/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks.js";

test("smoke: no console errors on initial load", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await stubStripe(page);
  await setupMockCable(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );

  await page.goto("/");
  await expect(page.getByText("Your Next Obsession")).toBeVisible();

  const combinedErrors = [...consoleErrors, ...pageErrors];
  expect(
    combinedErrors,
    combinedErrors.length
      ? `Console/Page errors encountered:\n${combinedErrors.join("\n")}`
      : undefined,
  ).toEqual([]);
});
