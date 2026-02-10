import { expect, test } from "@playwright/test";
import { resolveAuctionsState } from "./prod/flows";

test("@p1 prod smoke: auctions page shows data or explicit empty state", async ({
  page,
}) => {
  const response = await page.goto("/auctions", {
    waitUntil: "domcontentloaded",
  });
  expect(response, "Missing /auctions document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);

  await expect(page.locator("main")).toBeVisible();

  const state = await resolveAuctionsState(page);

  if (state.kind === "session_expired") {
    throw new Error(
      `Guest auctions access appears broken (redirect/login): ${state.message}`,
    );
  }
  if (state.kind === "error") {
    throw new Error(`Auctions page rendered an error alert: ${state.message}`);
  }
  if (state.kind === "loading" || state.kind === "unknown") {
    throw new Error(state.message);
  }
  if (state.kind === "cards") {
    await expect(
      page.locator('[data-testid^="auction-card-"]').first(),
    ).toBeVisible();
  } else {
    await expect(page.getByText("No auctions found.")).toBeVisible();
  }
});
