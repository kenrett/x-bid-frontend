import { expect, test } from "@playwright/test";
import {
  assertNoLoginRateLimit,
  attachMutationLedger,
  createCleanupRegistry,
  createRunId,
  namespacedLabel,
  readMainAlertText,
  requireEnv,
  startMutationCapture,
} from "./prod/mutating";

const EXPECTED_MUTATING_PATHS = [
  /\/api\/v1\/login(?:[/?#]|$)/i,
  /\/api\/v1\/logout(?:[/?#]|$)/i,
  /\/api\/v1\/session\/refresh(?:[/?#]|$)/i,
  /\/api\/v1\/age_gate\/accept(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/bid-packs(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/bid-packs\/\d+(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/audit(?:[/?#]|$)/i,
];

const extractBidPackId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") return null;

  if ("id" in payload && typeof payload.id === "number") {
    return payload.id;
  }

  if (
    "bid_pack" in payload &&
    payload.bid_pack &&
    typeof payload.bid_pack === "object" &&
    "id" in payload.bid_pack &&
    typeof payload.bid_pack.id === "number"
  ) {
    return payload.bid_pack.id;
  }

  return null;
};

test("@m1 mutating smoke: admin can create, edit, and clean up bid pack", async ({
  page,
  baseURL,
}, testInfo) => {
  if (!baseURL) {
    throw new Error(
      "Missing baseURL for mutating smoke project configuration.",
    );
  }

  const adminEmail = requireEnv("MUTATING_SMOKE_ADMIN_EMAIL");
  const adminPassword = requireEnv("MUTATING_SMOKE_ADMIN_PASSWORD");
  const runId = createRunId();
  const name = namespacedLabel("smoke-bid-pack", runId);
  const updatedDescription = `Mutating smoke updated bid pack ${runId}`;

  const { registerCleanup, runCleanup } = createCleanupRegistry();
  const mutationCapture = startMutationCapture(
    page,
    baseURL,
    EXPECTED_MUTATING_PATHS,
  );

  let createdBidPackId: number | null = null;
  let cleanupFailures: Array<{ label: string; message: string }> = [];
  let primaryError: unknown;

  try {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email address").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);

    const loginRequestPromise = page
      .waitForRequest(
        (request) =>
          /\/api\/v1\/login(?:[/?#]|$)/i.test(request.url()) &&
          request.method() === "POST",
        { timeout: 10_000 },
      )
      .catch(() => null);
    const loginResponsePromise = page
      .waitForResponse(
        (response) =>
          /\/api\/v1\/login(?:[/?#]|$)/i.test(response.url()) &&
          response.request().method() === "POST",
        { timeout: 30_000 },
      )
      .catch(() => null);
    await page.getByRole("button", { name: "Sign in" }).click();

    const loginRequest = await loginRequestPromise;
    if (!loginRequest) {
      const loginAlertText = await readMainAlertText(page);
      assertNoLoginRateLimit(
        loginAlertText,
        "@m1 bid-pack login blocked by rate limiting or account lockout",
      );
      const signInButtonEnabled = await page
        .getByRole("button", { name: /Sign in|Signing in/i })
        .first()
        .isEnabled()
        .catch(() => false);
      throw new Error(
        `Login request was not sent after clicking Sign in (url=${page.url()}, signInEnabled=${signInButtonEnabled}). ${loginAlertText || "No login alert text found."}`,
      );
    }

    const loginResponse = await loginResponsePromise;
    if (!loginResponse) {
      const failure = loginRequest.failure()?.errorText ?? "unknown_failure";
      throw new Error(
        `Login request was sent but no response was observed (request=${loginRequest.url()}, failure=${failure}).`,
      );
    }
    if (!loginResponse.ok()) {
      const responseBody = await loginResponse.text().catch(() => "");
      throw new Error(
        `Login failed with ${loginResponse.status()}: ${responseBody}`,
      );
    }

    const landedOnAuctions = await page
      .waitForURL(/\/auctions(?:[/?#]|$)/, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!landedOnAuctions) {
      const alertText = await readMainAlertText(page);
      assertNoLoginRateLimit(
        alertText,
        "@m1 bid-pack login blocked by rate limiting or account lockout",
      );
      throw new Error(
        `Login did not reach /auctions (url=${page.url()}). UI alert: ${alertText || "No alert text found."}`,
      );
    }
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

    await page.goto("/admin/bid-packs/new", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /new bid pack/i }),
    ).toBeVisible();

    await page.getByLabel("Name *").fill(name);
    await page
      .getByLabel("Description")
      .fill(`Mutating smoke bid pack ${runId} (smoke-only)`);
    await page.getByLabel("Bids *").fill("1");
    await page.getByLabel("Price *").fill("0.01");

    const createResponsePromise = page.waitForResponse(
      (response) =>
        /\/api\/v1\/admin\/bid-packs(?:[/?#]|$)/i.test(response.url()) &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "Create bid pack" }).click();
    const createResponse = await createResponsePromise;
    if (!createResponse.ok()) {
      const responseBody = await createResponse.text().catch(() => "");
      throw new Error(
        `Create bid pack failed with ${createResponse.status()}: ${responseBody}`,
      );
    }
    await expect(page).toHaveURL("/admin/bid-packs");
    await expect(page.getByText(name)).toBeVisible();
    const createJson = await createResponse.json().catch(() => null);
    createdBidPackId = extractBidPackId(createJson);
    if (!createdBidPackId) {
      throw new Error("Could not determine created bid pack id from response.");
    }

    registerCleanup(`retire-bid-pack-${createdBidPackId}`, async () => {
      await page.goto("/admin/bid-packs", { waitUntil: "domcontentloaded" });

      const search = page.getByRole("searchbox", { name: "Search by name" });
      await search.fill(name);

      const row = page
        .getByRole("row", { name: new RegExp(name, "i") })
        .first();
      const rowCount = await row.count();
      if (rowCount === 0) {
        return;
      }

      const retireButton = row.getByRole("button", { name: "Retire" });
      const canRetire = await retireButton.isVisible().catch(() => false);
      if (!canRetire) {
        return;
      }

      page.once("dialog", (dialog) => dialog.accept());
      await retireButton.click();
      await expect(row).toContainText("Retired");
    });

    await page.goto(`/admin/bid-packs/${createdBidPackId}/edit`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /update bid pack/i }),
    ).toBeVisible();

    await page.getByLabel("Description").fill(updatedDescription);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        new RegExp(
          `/api/v1/admin/bid-packs/${createdBidPackId}(?:[/?#]|$)`,
          "i",
        ).test(response.url()) && response.request().method() === "PUT",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL("/admin/bid-packs");
    await expect(page.getByText(name)).toBeVisible();
    await updateResponsePromise;
  } catch (error) {
    primaryError = error;
  } finally {
    mutationCapture.stop();
    cleanupFailures = await runCleanup();

    await attachMutationLedger(testInfo, {
      test: "@m1 mutating smoke: admin can create, edit, and clean up bid pack",
      baseURL,
      runId,
      createdBidPackId,
      cleanupFailures,
      allowedMutations: mutationCapture.allowed,
      unexpectedMutations: mutationCapture.unexpected,
    });
  }

  if (cleanupFailures.length) {
    const cleanupError = new Error(
      `Cleanup failed:\n${cleanupFailures.map((failure) => `${failure.label}: ${failure.message}`).join("\n")}`,
    );
    if (primaryError) {
      throw new AggregateError(
        [primaryError, cleanupError],
        "Test and cleanup both failed.",
      );
    }
    throw cleanupError;
  }

  if (primaryError) {
    throw primaryError;
  }

  expect(
    mutationCapture.unexpected,
    mutationCapture.unexpected.length
      ? `Unexpected mutating requests detected:\n${mutationCapture.unexpected.join("\n")}`
      : undefined,
  ).toEqual([]);
});
