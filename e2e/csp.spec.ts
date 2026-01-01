import { expect, test } from "@playwright/test";
import { fulfillJson, isDocumentRequest } from "./fixtures/mocks";

test("no CSP violations on primary pages", async ({ page }) => {
  const cspViolations: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      /content security policy/i.test(text) ||
      /csp/i.test(text) ||
      /refused to (load|execute)/i.test(text)
    ) {
      cspViolations.push(text);
    }
  });

  await page.route("**/api/v1/auctions", (route) =>
    isDocumentRequest(route) ? route.continue() : fulfillJson(route, []),
  );

  await page.goto("/auctions");
  await expect(page).toHaveURL(/\/auctions$/);

  expect(cspViolations, cspViolations.join("\n")).toEqual([]);
});
