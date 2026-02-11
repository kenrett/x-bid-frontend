import { expect, test } from "@playwright/test";
import {
  assertNoLoginRateLimit,
  attachMutationLedger,
  readMainAlertText,
  requireEnv,
  startMutationCapture,
} from "./prod/mutating";

const EXPECTED_MUTATING_PATHS = [
  /\/api\/v1\/login(?:[/?#]|$)/i,
  /\/api\/v1\/logout(?:[/?#]|$)/i,
  /\/api\/v1\/session\/refresh(?:[/?#]|$)/i,
  /\/api\/v1\/age_gate\/accept(?:[/?#]|$)/i,
];

test("@m0 mutating smoke: auth session login/logout lifecycle", async ({
  page,
  baseURL,
}, testInfo) => {
  if (!baseURL) {
    throw new Error(
      "Missing baseURL for mutating smoke project configuration.",
    );
  }

  const email = requireEnv("MUTATING_SMOKE_USER_EMAIL");
  const password = requireEnv("MUTATING_SMOKE_USER_PASSWORD");

  const mutationCapture = startMutationCapture(
    page,
    baseURL,
    EXPECTED_MUTATING_PATHS,
  );

  try {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email address")).toBeVisible();

    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    const landedOnAuctions = await page
      .waitForURL(/\/auctions(?:[/?#]|$)/, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!landedOnAuctions) {
      const alertText = await readMainAlertText(page);
      assertNoLoginRateLimit(
        alertText,
        "@m0 login blocked by rate limiting or account lockout",
      );
      throw new Error(
        `Login did not reach /auctions (url=${page.url()}). UI alert: ${alertText || "No alert text found."}`,
      );
    }
    await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();

    await page.getByRole("button", { name: "Log Out" }).click();
    await expect(page.getByRole("button", { name: "Log Out" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();

    const didLoginMutate = mutationCapture.allowed.some((entry) =>
      /\/api\/v1\/login(?:[/?#]|$)/i.test(entry),
    );
    const didLogoutMutate = mutationCapture.allowed.some((entry) =>
      /\/api\/v1\/logout(?:[/?#]|$)/i.test(entry),
    );

    expect(didLoginMutate, "Expected /api/v1/login mutating request").toBe(
      true,
    );
    expect(didLogoutMutate, "Expected /api/v1/logout mutating request").toBe(
      true,
    );

    expect(
      mutationCapture.unexpected,
      mutationCapture.unexpected.length
        ? `Unexpected mutating requests detected:\n${mutationCapture.unexpected.join("\n")}`
        : undefined,
    ).toEqual([]);
  } finally {
    mutationCapture.stop();
    await attachMutationLedger(testInfo, {
      test: "@m0 mutating smoke: auth session login/logout lifecycle",
      baseURL,
      allowedMutations: mutationCapture.allowed,
      unexpectedMutations: mutationCapture.unexpected,
    });
  }
});
