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
  request,
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

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        /\/api\/v1\/login(?:[/?#]|$)/i.test(response.url()) &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/auctions(?:[/?#]|$)/);
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

    const loginResponse = await loginResponsePromise;
    const loginJson = await loginResponse.json().catch(() => null);
    const accessToken =
      loginJson && typeof loginJson === "object" && "access_token" in loginJson
        ? (loginJson.access_token as string | undefined)
        : undefined;
    if (!accessToken) {
      throw new Error("Login did not return an access token.");
    }

    const adminApi = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    await page.goto("/admin/auctions/new", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /new auction/i }),
    ).toBeVisible();

    await page.getByLabel("Title *").fill(title);
    await page.getByLabel("Description").fill(description);
    await page.getByLabel("Status").selectOption("scheduled");
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
    await expect(page).toHaveURL("/admin/auctions");
    await expect(page.getByText(title)).toBeVisible();

    const createResponse = await createResponsePromise;
    const createJson = await createResponse.json().catch(() => null);
    createdAuctionId = extractAuctionId(createJson);
    if (!createdAuctionId) {
      throw new Error(
        "Could not determine created auction id from create response.",
      );
    }

    registerCleanup(`delete-auction-${createdAuctionId}`, async () => {
      const response = await adminApi.delete(
        `/api/v1/admin/auctions/${createdAuctionId}`,
      );
      if (!response.ok()) {
        throw new Error(
          `DELETE /api/v1/admin/auctions/${createdAuctionId} failed with ${response.status()}.`,
        );
      }
    });

    await page.goto(`/admin/auctions/${createdAuctionId}/edit`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /update auction/i }),
    ).toBeVisible();

    await page.getByLabel("Title *").fill(updatedTitle);
    await page.getByLabel("Description").fill(updatedDescription);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        new RegExp(
          `/api/v1/admin/auctions/${createdAuctionId}(?:[/?#]|$)`,
          "i",
        ).test(response.url()) && response.request().method() === "PUT",
      { timeout: 15_000 },
    );

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL("/admin/auctions");
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await updateResponsePromise;

    await adminApi.dispose();
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
