import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const isKnownInlineCspViolation = (message: string) =>
  message.includes("Executing inline script violates") &&
  message.includes("Content Security Policy directive 'script-src-elem");

const captureRuntimeErrors = (page: Page) => {
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

  return { consoleErrors, pageErrors };
};

test("prod smoke: homepage loads and has no runtime errors", async ({
  page,
}) => {
  const strictCsp = process.env.PROD_SMOKE_STRICT_CSP === "true";
  const { consoleErrors, pageErrors } = captureRuntimeErrors(page);

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response, "Missing initial document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);

  await expect(page.locator("body")).toBeVisible();
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
