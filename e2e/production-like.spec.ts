import { expect, test } from "./fixtures/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
} from "./fixtures/mocks";

test("production-like: / has no console/CSP errors and CLS <= 0.1", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const cspMentions: string[] = [];

  let navLogoBytes: number | null = null;

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text);
    if (text.includes("Content Security Policy") || text.includes("violates")) {
      cspMentions.push(text);
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
    if (
      err.message.includes("Content Security Policy") ||
      err.message.includes("violates")
    ) {
      cspMentions.push(err.message);
    }
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/assets/BidderSweet.svg")) return;
    try {
      const body = await response.body();
      navLogoBytes = body.byteLength;
    } catch {
      // ignore
    }
  });

  await setupMockCable(page);

  await page.addInitScript(() => {
    (window as unknown as { __cls?: number }).__cls = 0;
    (window as unknown as { __clsEntries?: unknown[] }).__clsEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
        startTime: number;
      }>) {
        if (entry.hadRecentInput) continue;
        (window as unknown as { __cls?: number }).__cls =
          ((window as unknown as { __cls?: number }).__cls ?? 0) + entry.value;
        (window as unknown as { __clsEntries?: unknown[] }).__clsEntries?.push({
          value: entry.value,
          startTime: entry.startTime,
        });
      }
    });

    observer.observe({ type: "layout-shift", buffered: true });
  });

  await page.route("**/api/v1/auctions", async (route) => {
    if (isDocumentRequest(route)) return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 600));
    return fulfillJson(route, auctionList);
  });

  await page.goto("/");
  await expect(page.getByText("Your Next Obsession")).toBeVisible();
  await expect(page.getByTestId("auction-card-101")).toBeVisible();

  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
  );

  const cls = await page.evaluate(() => {
    return (window as unknown as { __cls?: number }).__cls ?? 0;
  });
  const clsEntries = await page.evaluate(() => {
    return (window as unknown as { __clsEntries?: unknown[] }).__clsEntries;
  });

  expect(
    [...consoleErrors, ...pageErrors],
    consoleErrors.length || pageErrors.length
      ? `Console/Page errors encountered:\n${[...consoleErrors, ...pageErrors].join("\n")}`
      : undefined,
  ).toEqual([]);

  expect(
    cspMentions,
    cspMentions.length
      ? `CSP-related console output encountered:\n${cspMentions.join("\n")}`
      : undefined,
  ).toEqual([]);

  // Optional: assert the preloaded nav logo stays lightweight.
  expect(navLogoBytes, "BidderSweet.svg was not fetched").not.toBeNull();
  expect(navLogoBytes ?? 0).toBeLessThanOrEqual(10 * 1024);

  // Optional: fail on CLS regression.
  expect(
    cls,
    `CLS too high: ${cls}\n${JSON.stringify(clsEntries, null, 2)}`,
  ).toBeLessThanOrEqual(0.1);
});
