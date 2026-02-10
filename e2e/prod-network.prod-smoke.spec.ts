import { expect, test } from "@playwright/test";
import { captureNetworkSignals } from "./prod/signals";

test("@p0 prod smoke: critical network requests stay healthy", async ({
  page,
  baseURL,
}) => {
  const strictPerf = process.env.PROD_SMOKE_STRICT_PERF === "true";
  const slowThresholdMs = Number(process.env.PROD_SMOKE_SLOW_MS ?? "3000");
  if (!baseURL) {
    throw new Error("Missing baseURL for prod smoke project configuration.");
  }

  const { failedRequests, serverErrors, slowResponses } = captureNetworkSignals(
    page,
    baseURL,
    Number.isFinite(slowThresholdMs) ? slowThresholdMs : 3_000,
  );

  const response = await page.goto("/", { waitUntil: "load" });
  expect(response, "Missing initial document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);

  expect(
    failedRequests,
    failedRequests.length
      ? `Critical request failures encountered:\n${failedRequests.join("\n")}`
      : undefined,
  ).toEqual([]);

  expect(
    serverErrors,
    serverErrors.length
      ? `5xx responses encountered:\n${serverErrors.join("\n")}`
      : undefined,
  ).toEqual([]);

  if (strictPerf) {
    expect(
      slowResponses,
      slowResponses.length
        ? `Slow critical responses encountered:\n${slowResponses.join("\n")}`
        : undefined,
    ).toEqual([]);
  } else if (slowResponses.length > 0) {
    await test.info().attach("slow-critical-responses.txt", {
      contentType: "text/plain",
      body: Buffer.from([...new Set(slowResponses)].join("\n"), "utf8"),
    });
  }
});
