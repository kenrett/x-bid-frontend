import { expect, test } from "@playwright/test";
import {
  auctionList,
  fulfillJson,
  isDocumentRequest,
  setupMockCable,
} from "./fixtures/mocks";

test("home page CLS stays under 0.1 (footer stable)", async ({ page }) => {
  await setupMockCable(page);

  await page.addInitScript(() => {
    (window as unknown as { __cls?: number }).__cls = 0;
    (window as unknown as { __clsEntries?: unknown[] }).__clsEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
        startTime: number;
        sources?: Array<{
          node?: Node;
          previousRect?: DOMRectReadOnly;
          currentRect?: DOMRectReadOnly;
        }>;
      }>) {
        if (entry.hadRecentInput) continue;
        (window as unknown as { __cls?: number }).__cls =
          ((window as unknown as { __cls?: number }).__cls ?? 0) + entry.value;

        (window as unknown as { __clsEntries?: unknown[] }).__clsEntries?.push({
          value: entry.value,
          startTime: entry.startTime,
          sources: entry.sources?.map((source) => ({
            tagName:
              source.node && "tagName" in source.node
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (source.node as any).tagName
                : undefined,
            previousRect: source.previousRect,
            currentRect: source.currentRect,
          })),
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
  await expect(page.getByTestId("auction-card-101")).toBeVisible();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
  );

  const cls = await page.evaluate(() => {
    return (window as unknown as { __cls?: number }).__cls ?? 0;
  });
  const entries = await page.evaluate(() => {
    return (window as unknown as { __clsEntries?: unknown[] }).__clsEntries;
  });

  expect(
    cls,
    `CLS too high: ${cls}\n${JSON.stringify(entries, null, 2)}`,
  ).toBeLessThanOrEqual(0.1);
});
