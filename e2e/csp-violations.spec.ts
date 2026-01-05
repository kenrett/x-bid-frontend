import { expect, test } from "@playwright/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
  stubStripe,
} from "./fixtures/mocks";

test("no CSP violations are logged to the console", async ({ page }) => {
  const violations: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("Content Security Policy")) violations.push(text);
    if (text.includes("violates the following Content Security Policy"))
      violations.push(text);
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

  expect(
    violations,
    violations.length
      ? `CSP violations encountered:\n${violations.join("\n")}`
      : undefined,
  ).toEqual([]);
});
