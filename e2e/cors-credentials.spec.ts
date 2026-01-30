import { expect, test } from "./fixtures/test";

test("credentialed API requests avoid CORS credential errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    consoleErrors.push(msg.text());
  });

  await page.addInitScript(() => {
    const records: { url: string; withCredentials: boolean }[] = [];
    // @ts-expect-error test-only hook
    window.__xhrRecords = records;

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (...args) {
      const url = typeof args[1] === "string" ? args[1] : "";
      // @ts-expect-error test-only tracking
      this.__trackedUrl = url;
      return originalOpen.apply(this, args as Parameters<typeof originalOpen>);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      // @ts-expect-error test-only tracking
      const url =
        typeof this.__trackedUrl === "string" ? this.__trackedUrl : "";
      records.push({ url, withCredentials: this.withCredentials });
      return originalSend.apply(this, args as Parameters<typeof originalSend>);
    };
  });

  await page.goto("/auctions");

  const xhrRecords = await page.evaluate(
    () =>
      // @ts-expect-error test-only hook
      (window.__xhrRecords ?? []) as {
        url: string;
        withCredentials: boolean;
      }[],
  );
  const apiRecords = xhrRecords.filter((record) =>
    record.url.includes("/api/v1/"),
  );

  expect(apiRecords.length).toBeGreaterThan(0);
  for (const record of apiRecords) {
    expect(record.withCredentials).toBe(true);
  }

  const corsErrors = consoleErrors.filter((text) =>
    text.toLowerCase().includes("access-control-allow-credentials"),
  );
  expect(corsErrors).toEqual([]);
});
