import { expect, test } from "@playwright/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

test("smoke: logo loads fast and is sized", async ({ page }) => {
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

  const logoResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/assets/nav-logo.svg"),
  );

  await stubStripe(page);
  await setupMockCable(page);

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route)
      ? route.continue()
      : fulfillJson(route, auctionList),
  );

  await page.goto("/");

  await expect(page.getByAltText("X-Bid Logo")).toBeVisible({ timeout: 1_000 });

  const logoResponse = await logoResponsePromise;
  const contentType = logoResponse.headers()["content-type"] ?? "";
  const logoBytes = (await logoResponse.body()).byteLength;

  expect(contentType).toContain("image/svg+xml");
  expect(logoBytes).toBeLessThan(200 * 1024);

  const combinedErrors = [...consoleErrors, ...pageErrors];
  expect(
    combinedErrors,
    combinedErrors.length
      ? `Console/Page errors encountered:\n${combinedErrors.join("\n")}`
      : undefined,
  ).toEqual([]);
});
