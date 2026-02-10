import type { Page } from "@playwright/test";

export type AuctionsState =
  | { kind: "cards"; count: number }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "session_expired"; message: string }
  | { kind: "loading"; message: string }
  | { kind: "unknown"; message: string };

type AuctionsNetworkSummary = {
  requestCount: number;
  completedCount: number;
  slowestDurationMs: number;
  latestStartMs: number;
};

const getAuctionsNetworkSummary = async (
  page: Page,
): Promise<AuctionsNetworkSummary> => {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType("resource").filter((entry) => {
      const name = entry.name || "";
      return /\/api\/v1\/auctions(?:[/?#]|$)/i.test(name);
    });

    let completedCount = 0;
    let slowestDurationMs = 0;
    let latestStartMs = 0;

    for (const entry of entries) {
      const duration = Number.isFinite(entry.duration) ? entry.duration : 0;
      const startTime = Number.isFinite(entry.startTime) ? entry.startTime : 0;

      if (duration > 0) completedCount += 1;
      if (duration > slowestDurationMs) slowestDurationMs = duration;
      if (startTime > latestStartMs) latestStartMs = startTime;
    }

    return {
      requestCount: entries.length,
      completedCount,
      slowestDurationMs: Math.round(slowestDurationMs),
      latestStartMs: Math.round(latestStartMs),
    };
  });
};

export const getSessionExpiredRedirectUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const isLogin = /\/login(?:[/?#]|$)/i.test(parsed.pathname);
    const reason = parsed.searchParams.get("reason");
    return isLogin && reason === "session_expired" ? url : null;
  } catch {
    return null;
  }
};

export const waitForRouteOrSessionExpired = async (
  page: Page,
  expected: RegExp,
  timeoutMs = 10_000,
): Promise<{ kind: "ok" } | { kind: "session_expired"; url: string }> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const currentUrl = page.url();
    const sessionExpiredRedirect = getSessionExpiredRedirectUrl(currentUrl);
    if (sessionExpiredRedirect) {
      return { kind: "session_expired", url: sessionExpiredRedirect };
    }
    if (expected.test(currentUrl)) {
      return { kind: "ok" };
    }
    await page.waitForTimeout(250);
  }

  const finalUrl = page.url();
  const sessionExpiredRedirect = getSessionExpiredRedirectUrl(finalUrl);
  if (sessionExpiredRedirect) {
    return { kind: "session_expired", url: sessionExpiredRedirect };
  }
  throw new Error(
    `Timed out waiting for route ${expected.toString()} (final url=${finalUrl}).`,
  );
};

export const acceptAgeGateIfPresent = async (page: Page): Promise<boolean> => {
  const confirm = page.getByRole("button", { name: "I am 18+" });
  const isVisible = await confirm
    .isVisible({ timeout: 1_500 })
    .catch(() => false);
  if (!isVisible) return false;

  await confirm.click();
  await expect(confirm).toBeHidden({ timeout: 10_000 });
  return true;
};

export const resolveAuctionsState = async (
  page: Page,
): Promise<AuctionsState> => {
  await acceptAgeGateIfPresent(page);

  const cards = page.locator('[data-testid^="auction-card-"]');
  const empty = page.getByText("No auctions found.");
  const alerts = page.locator("main [role='alert']");
  const sessionExpiredNotice = page.getByText(
    /Your session expired, please log in again\./i,
  );
  const loading = page.getByText(/Loading auctions/i);
  const timeoutMs = Number(
    process.env.PROD_SMOKE_AUCTIONS_TIMEOUT_MS ?? "45000",
  );
  const deadline = Date.now() + timeoutMs;

  let sawLoading = false;

  while (Date.now() < deadline) {
    await acceptAgeGateIfPresent(page);

    const [alertCount, cardCount, emptyCount, loadingCount] = await Promise.all(
      [alerts.count(), cards.count(), empty.count(), loading.count()],
    );
    const sessionExpiredCount = await sessionExpiredNotice.count();
    const currentUrl = page.url();
    const sessionExpiredRedirect = getSessionExpiredRedirectUrl(currentUrl);

    if (sessionExpiredRedirect && sessionExpiredCount > 0) {
      return {
        kind: "session_expired",
        message: `Redirected to login with session-expired notice (url=${sessionExpiredRedirect}).`,
      };
    }

    if (alertCount > 0) {
      const message = (await alerts.first().innerText()).trim();
      return { kind: "error", message };
    }
    if (cardCount > 0) {
      return { kind: "cards", count: cardCount };
    }
    if (emptyCount > 0) {
      return { kind: "empty" };
    }
    if (loadingCount > 0) {
      sawLoading = true;
    }

    await page.waitForTimeout(400);
  }

  if (sawLoading) {
    const title = await page.title().catch(() => "");
    const network = await getAuctionsNetworkSummary(page).catch(
      () =>
        ({
          requestCount: 0,
          completedCount: 0,
          slowestDurationMs: 0,
          latestStartMs: 0,
        }) satisfies AuctionsNetworkSummary,
    );
    return {
      kind: "loading",
      message: `Auctions stayed in loading state for ${Math.round(timeoutMs / 1000)}s (url=${page.url()}, title="${title}", network=${JSON.stringify(
        network,
      )}).`,
    };
  }

  const title = await page.title().catch(() => "");
  return {
    kind: "unknown",
    message: `Auctions page showed no cards, empty state, alert, or loading indicator (url=${page.url()}, title="${title}").`,
  };
};
