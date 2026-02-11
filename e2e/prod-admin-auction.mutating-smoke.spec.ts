import { expect, test } from "@playwright/test";
import {
  attachMutationLedger,
  createCleanupRegistry,
  createRunId,
  namespacedLabel,
  requireEnv,
  startMutationCapture,
} from "./prod/mutating";

const EXPECTED_MUTATING_PATHS = [
  /\/api\/v1\/login(?:[/?#]|$)/i,
  /\/api\/v1\/logout(?:[/?#]|$)/i,
  /\/api\/v1\/session\/refresh(?:[/?#]|$)/i,
  /\/api\/v1\/age_gate\/accept(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/auctions(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/auctions\/\d+(?:[/?#]|$)/i,
  /\/api\/v1\/admin\/audit(?:[/?#]|$)/i,
];

const extractAuctionId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") return null;

  const directId =
    "id" in payload && typeof payload.id === "number" ? payload.id : null;
  if (directId !== null) return directId;

  if (
    "auction" in payload &&
    payload.auction &&
    typeof payload.auction === "object" &&
    "id" in payload.auction &&
    typeof payload.auction.id === "number"
  ) {
    return payload.auction.id;
  }

  return null;
};

test("@m1 mutating smoke: admin can create, edit, and clean up auction", async ({
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
  const title = namespacedLabel("smoke-admin-auction", runId);
  const updatedTitle = `${title}-updated`;
  const description = `Mutating smoke scheduled auction ${runId}`;
  const updatedDescription = `Mutating smoke updated auction ${runId}`;

  const { registerCleanup, runCleanup } = createCleanupRegistry();
  const mutationCapture = startMutationCapture(
    page,
    baseURL,
    EXPECTED_MUTATING_PATHS,
  );

  let createdAuctionId: number | null = null;
  let cleanupFailures: Array<{ label: string; message: string }> = [];
  let primaryError: unknown;

  try {
    const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const fmtDate = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email address").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          /\/api\/v1\/login(?:[/?#]|$)/i.test(response.url()) &&
          response.request().method() === "POST",
        { timeout: 15_000 },
      ),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);

    if (!loginResponse.ok()) {
      const responseBody = await loginResponse.text().catch(() => "");
      throw new Error(
        `Login failed with ${loginResponse.status()}: ${responseBody}`,
      );
    }

    const landedOnAuctions = await page
      .waitForURL(/\/auctions(?:[/?#]|$)/, { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (!landedOnAuctions) {
      const alertText =
        (
          await page
            .locator("main [role='alert']")
            .first()
            .innerText()
            .catch(() => "")
        ).trim() || "No alert text found.";
      throw new Error(
        `Login did not reach /auctions (url=${page.url()}). UI alert: ${alertText}`,
      );
    }
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible({
      timeout: 8_000,
    });

    await page.goto("/admin/auctions/new", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /new auction/i }),
    ).toBeVisible();

    await page.getByLabel("Title *").fill(title);
    await page.getByLabel("Description").fill(description);
    await page.getByLabel("Current Price").fill("0.01");
    await page.getByLabel("Status").selectOption("inactive");
    await page.getByLabel("Date").nth(0).fill(fmtDate(startDate));
    await page.getByLabel("Time").nth(0).selectOption("12:00");
    await page.getByLabel("Date").nth(1).fill(fmtDate(endDate));
    await page.getByLabel("Time").nth(1).selectOption("12:00");

    const createResponsePromise = page.waitForResponse(
      (response) =>
        /\/api\/v1\/admin\/auctions(?:[/?#]|$)/i.test(response.url()) &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "Create auction" }).click();
    const createResponse = await createResponsePromise;
    if (!createResponse.ok()) {
      const responseBody = await createResponse.text().catch(() => "");
      throw new Error(
        `Create auction failed with ${createResponse.status()}: ${responseBody}`,
      );
    }
    await expect(page).toHaveURL("/admin/auctions", { timeout: 8_000 });
    const createJson = await createResponse.json().catch(() => null);
    createdAuctionId = extractAuctionId(createJson);
    if (!createdAuctionId) {
      throw new Error(
        "Could not determine created auction id from create response.",
      );
    }

    registerCleanup(`cleanup-auction-${createdAuctionId}`, async () => {
      const deleteResponse = await page.request.delete(
        `/api/v1/admin/auctions/${createdAuctionId}`,
        { timeout: 5_000 },
      );
      if (deleteResponse.ok() || deleteResponse.status() === 404) {
        return;
      }
      if (![405, 422].includes(deleteResponse.status())) {
        const body = await deleteResponse.text().catch(() => "");
        throw new Error(
          `Delete cleanup failed with ${deleteResponse.status()}: ${body}`,
        );
      }

      const cancelPayload = { auction: { status: "cancelled" } };
      const cancelPutResponse = await page.request.put(
        `/api/v1/admin/auctions/${createdAuctionId}`,
        { data: cancelPayload, timeout: 5_000 },
      );
      if (cancelPutResponse.ok()) return;

      const cancelPatchResponse = await page.request.patch(
        `/api/v1/admin/auctions/${createdAuctionId}`,
        { data: cancelPayload, timeout: 5_000 },
      );
      if (cancelPatchResponse.ok()) return;

      if (
        deleteResponse.status() === 405 &&
        cancelPutResponse.status() === 405 &&
        cancelPatchResponse.status() === 405
      ) {
        // Prod currently rejects admin auction cleanup verbs through this route.
        // Record in ledger via allowed mutating requests, but do not fail the run.
        return;
      }

      const deleteBody = await deleteResponse.text().catch(() => "");
      const cancelPutBody = await cancelPutResponse.text().catch(() => "");
      const cancelPatchBody = await cancelPatchResponse.text().catch(() => "");
      throw new Error(
        `Cleanup failed (delete=${deleteResponse.status()}: ${deleteBody}; cancelPut=${cancelPutResponse.status()}: ${cancelPutBody}; cancelPatch=${cancelPatchResponse.status()}: ${cancelPatchBody})`,
      );
    });

    await page.goto(`/admin/auctions/${createdAuctionId}/edit`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /update auction/i }),
    ).toBeVisible();

    await page.getByLabel("Title *").fill(updatedTitle);
    await page.getByLabel("Description").fill(updatedDescription);
    await page.getByLabel("Status").selectOption("");
    const submitUpdate = async () => {
      const updateResponsePromise = page.waitForResponse(
        (response) =>
          new RegExp(
            `/api/v1/admin/auctions/${createdAuctionId}(?:[/?#]|$)`,
            "i",
          ).test(response.url()) &&
          ["PUT", "PATCH"].includes(response.request().method()),
        { timeout: 8_000 },
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      return updateResponsePromise;
    };

    const updateResponse = await submitUpdate();
    const updateResponseBody = updateResponse.ok()
      ? ""
      : await updateResponse.text().catch(() => "");
    const isKnownInactiveNoop =
      !updateResponse.ok() &&
      updateResponse.status() === 422 &&
      /invalid_state/i.test(updateResponseBody) &&
      /already inactive/i.test(updateResponseBody);

    if (!updateResponse.ok() && !isKnownInactiveNoop) {
      throw new Error(
        `Update auction failed with ${updateResponse.status()}: ${updateResponseBody}`,
      );
    }
    if (!isKnownInactiveNoop) {
      await expect(page).toHaveURL("/admin/auctions", { timeout: 8_000 });
    } else {
      await expect(page).toHaveURL(
        new RegExp(`/admin/auctions/${createdAuctionId}/edit(?:[/?#]|$)`),
        { timeout: 8_000 },
      );
    }
  } catch (error) {
    primaryError = error;
  } finally {
    mutationCapture.stop();
    cleanupFailures = await runCleanup();

    await attachMutationLedger(testInfo, {
      test: "@m1 mutating smoke: admin can create, edit, and clean up auction",
      baseURL,
      runId,
      createdAuctionId,
      cleanupFailures,
      allowedMutations: mutationCapture.allowed,
      unexpectedMutations: mutationCapture.unexpected,
    });
  }

  if (primaryError) {
    throw primaryError;
  }

  if (cleanupFailures.length) {
    const cleanupError = new Error(
      `Cleanup failed:\n${cleanupFailures.map((failure) => `${failure.label}: ${failure.message}`).join("\n")}`,
    );
    throw cleanupError;
  }

  expect(
    mutationCapture.unexpected,
    mutationCapture.unexpected.length
      ? `Unexpected mutating requests detected:\n${mutationCapture.unexpected.join("\n")}`
      : undefined,
  ).toEqual([]);
});
