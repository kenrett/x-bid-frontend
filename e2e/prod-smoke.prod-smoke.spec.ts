import { expect, test } from "@playwright/test";
import {
  captureRuntimeErrorSignals,
  isKnownInlineCspViolation,
} from "./prod/signals";
import { inferStorefrontKeyFromHostname } from "./prod/targets";

test("@p0 prod smoke: storefront homepage boots cleanly", async ({ page }) => {
  const strictCsp = process.env.PROD_SMOKE_STRICT_CSP === "true";
  const { consoleErrors, pageErrors } = captureRuntimeErrorSignals(page);

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response, "Missing initial document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);

  const url = new URL(page.url());
  const expectedStorefront = inferStorefrontKeyFromHostname(url.hostname);
  await expect(page.locator("html")).toHaveAttribute(
    "data-storefront",
    expectedStorefront,
  );

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("body")).toContainText(/\S/);
  await expect
    .poll(() => page.title(), { message: "Page title should not be empty" })
    .not.toBe("");

  const combinedErrors = [...consoleErrors, ...pageErrors];
  const knownCspViolations = combinedErrors.filter(isKnownInlineCspViolation);
  const unexpectedErrors = combinedErrors.filter(
    (message) => !isKnownInlineCspViolation(message),
  );

  expect(
    unexpectedErrors,
    unexpectedErrors.length
      ? `Console/Page errors encountered:\n${unexpectedErrors.join("\n")}`
      : undefined,
  ).toEqual([]);

  if (strictCsp) {
    expect(
      knownCspViolations,
      knownCspViolations.length
        ? `Known inline CSP violations encountered:\n${knownCspViolations.join("\n")}`
        : undefined,
    ).toEqual([]);
  } else if (knownCspViolations.length > 0) {
    await test.info().attach("known-csp-violations.txt", {
      contentType: "text/plain",
      body: Buffer.from([...new Set(knownCspViolations)].join("\n"), "utf8"),
    });
  }
});
