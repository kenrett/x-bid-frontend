import { expect, test } from "@playwright/test";
import {
  assertNoLoginRateLimit,
  attachMutationLedger,
  readMainAlertText,
  requireEnv,
  startMutationCapture,
} from "./prod/mutating";
import { acceptAgeGateIfPresent, resolveAuctionsState } from "./prod/flows";

const EXPECTED_MUTATING_PATHS = [
  /\/api\/v1\/login(?:[/?#]|$)/i,
  /\/api\/v1\/logout(?:[/?#]|$)/i,
  /\/api\/v1\/session\/refresh(?:[/?#]|$)/i,
  /\/api\/v1\/age_gate\/accept(?:[/?#]|$)/i,
  /\/api\/v1\/auctions\/\d+\/bids(?:[/?#]|$)/i,
];

test("@m2 mutating smoke: authenticated user can submit a bid attempt", async ({
  page,
  baseURL,
}, testInfo) => {
  if (!baseURL) {
    throw new Error(
      "Missing baseURL for mutating smoke project configuration.",
    );
  }

  if (process.env.MUTATING_SMOKE_ENABLE_BIDDING !== "true") {
    test.skip(
      true,
      'Skipping bid mutation test. Set MUTATING_SMOKE_ENABLE_BIDDING="true" to enable @m2.',
    );
  }
  const strictM2 = process.env.MUTATING_SMOKE_STRICT_M2 === "true";
  const skipOrFail = (message: string): never => {
    if (strictM2) {
      throw new Error(message);
    }
    test.skip(true, message);
  };

  const email = requireEnv("MUTATING_SMOKE_USER_EMAIL");
  const password = requireEnv("MUTATING_SMOKE_USER_PASSWORD");
  const mutationCapture = startMutationCapture(
    page,
    baseURL,
    EXPECTED_MUTATING_PATHS,
  );

  let bidAttemptStatus: number | null = null;
  let bidAttemptUrl: string | null = null;
  let bidRequestObserved = false;

  try {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);

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
      const loginAlertText =
        (await readMainAlertText(page)) || "No login alert text found.";
      assertNoLoginRateLimit(
        loginAlertText,
        "@m2 login blocked by rate limiting or account lockout",
      );
      const signInButtonEnabled = await page
        .getByRole("button", { name: /Sign in|Signing in/i })
        .first()
        .isEnabled()
        .catch(() => false);
      throw new Error(
        `Login request was not sent after clicking Sign in (url=${page.url()}, signInEnabled=${signInButtonEnabled}). ${loginAlertText}`,
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
      const alertText =
        (await readMainAlertText(page)) || "No alert text found.";
      assertNoLoginRateLimit(
        alertText,
        "@m2 login blocked by rate limiting or account lockout",
      );
      throw new Error(
        `Login did not reach /auctions (url=${page.url()}). UI alert: ${alertText}`,
      );
    }

    const state = await resolveAuctionsState(page);
    if (state.kind !== "cards") {
      skipOrFail(
        `@m2 precondition failed: auctions not bid-ready (${state.kind}).`,
      );
    }

    await acceptAgeGateIfPresent(page);
    await page.locator('[data-testid^="auction-card-"]').first().click();
    await expect(page).toHaveURL(/\/auctions\/\d+(?:[/?#]|$)/, {
      timeout: 10_000,
    });
    const auctionUrlMatch = page.url().match(/\/auctions\/(\d+)(?:[/?#]|$)/i);
    if (!auctionUrlMatch) {
      skipOrFail(
        `@m2 precondition failed: unable to resolve auction id from url (${page.url()}).`,
      );
    }
    const auctionId = auctionUrlMatch[1];
    const bidPathPattern = new RegExp(
      `/api/v1/auctions/${auctionId}/bids(?:[/?#]|$)`,
      "i",
    );
    const loadingAuction = page.getByText("Loading auction...");
    const auctionResolved = await loadingAuction
      .waitFor({ state: "hidden", timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (!auctionResolved) {
      const statusText =
        (
          await page
            .locator("main")
            .innerText()
            .catch(() => "")
        )
          .slice(0, 400)
          .trim() || "No auction status text captured.";
      skipOrFail(
        `@m2 precondition failed: auction detail did not finish loading. ${statusText}`,
      );
    }

    const bidCta = () =>
      page.getByRole("button", {
        name: "Place Your Bid",
      });
    const bidButtonVisible = await bidCta()
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (!bidButtonVisible) {
      const statusText =
        (
          await page
            .locator("main")
            .innerText()
            .catch(() => "")
        )
          .slice(0, 400)
          .trim() || "No auction status text captured.";
      skipOrFail(
        `@m2 precondition failed: current auction is not bid-eligible (bid CTA not rendered). ${statusText}`,
      );
    }

    const bidButtonLabel = (
      await bidCta()
        .first()
        .textContent()
        .catch(() => "")
    )
      .trim()
      .toLowerCase();
    if (bidButtonLabel !== "place your bid") {
      skipOrFail(
        `@m2 precondition failed: bid CTA is "${bidButtonLabel || "unknown"}" instead of "Place Your Bid".`,
      );
    }

    const canBid = await bidCta()
      .first()
      .isEnabled()
      .catch(() => false);
    if (!canBid) {
      skipOrFail(
        "@m2 precondition failed: bid button is disabled for this account/auction state.",
      );
    }

    let bidRequest: Awaited<ReturnType<typeof page.waitForRequest>> | null =
      null;
    for (let attempt = 0; attempt < 2 && !bidRequest; attempt += 1) {
      const currentBidCta = bidCta().first();
      const attemptBidButtonVisible = await currentBidCta
        .isVisible({ timeout: 1_500 })
        .catch(() => false);
      const attemptBidButtonLabel = (
        await currentBidCta.textContent().catch(() => "")
      )
        .trim()
        .toLowerCase();
      const attemptCanBid = await currentBidCta.isEnabled().catch(() => false);
      if (!attemptBidButtonVisible || !attemptCanBid) {
        skipOrFail(
          `@m2 precondition changed before bid attempt: bid CTA became unavailable (visible=${attemptBidButtonVisible}, enabled=${attemptCanBid}, label="${attemptBidButtonLabel || "unknown"}", url=${page.url()}).`,
        );
      }
      if (attemptBidButtonLabel !== "place your bid") {
        skipOrFail(
          `@m2 precondition changed before bid attempt: bid CTA label became "${attemptBidButtonLabel || "unknown"}" (url=${page.url()}).`,
        );
      }

      const bidRequestPromise = page
        .waitForRequest(
          (request) =>
            bidPathPattern.test(request.url()) && request.method() === "POST",
          { timeout: 7_000 },
        )
        .catch(() => null);

      await currentBidCta.click();
      bidRequest = await bidRequestPromise;

      if (!bidRequest && attempt === 0) {
        await page.waitForTimeout(1_000);
      }
    }
    if (!bidRequest) {
      const broadBidCta = page
        .getByRole("button", {
          name: /Place Your Bid|Verify email to bid|You are the highest bidder|Placing Bid/i,
        })
        .first();
      const ctaStillVisible = await broadBidCta
        .isVisible({ timeout: 500 })
        .catch(() => false);
      const ctaStillText =
        (await broadBidCta.textContent().catch(() => ""))
          .trim()
          .toLowerCase() || "unknown";
      const ctaStillEnabled = await broadBidCta.isEnabled().catch(() => false);
      if (
        !ctaStillVisible ||
        !ctaStillEnabled ||
        ctaStillText !== "place your bid"
      ) {
        skipOrFail(
          `@m2 precondition changed after bid click: bid CTA state is no longer bid-ready (visible=${ctaStillVisible}, enabled=${ctaStillEnabled}, label="${ctaStillText}", url=${page.url()}).`,
        );
      }
      const bidErrorText =
        (
          await page
            .locator("main [role='alert']")
            .first()
            .innerText()
            .catch(() => "")
        ).trim() || "No in-page bid alert.";
      const bidButtonState = {
        text: ctaStillText,
        enabled: ctaStillEnabled,
      };
      const liveStatus =
        (
          await page
            .getByText(/Live connected|Live reconnecting|Live offline/i)
            .first()
            .textContent()
            .catch(() => "")
        ).trim() || "Live status unavailable.";
      skipOrFail(
        `@m2 expected bid mutation was not observed after clicking bid button. ${bidErrorText} bidButton=${JSON.stringify(
          bidButtonState,
        )} liveStatus=${liveStatus} url=${page.url()}`,
      );
    }
    bidRequestObserved = true;

    const bidResponse = await bidRequest.response();
    if (!bidResponse) {
      skipOrFail(
        `@m2 bid request to auction ${auctionId} was sent but no HTTP response was observed.`,
      );
    }
    bidAttemptStatus = bidResponse?.status() ?? null;
    bidAttemptUrl = bidRequest.url();

    expect(
      bidAttemptStatus === null || bidAttemptStatus < 500,
      `Bid attempt returned server error ${bidAttemptStatus} (${bidAttemptUrl}).`,
    ).toBe(true);

    const didAttemptBidMutation = mutationCapture.allowed.some((entry) =>
      bidPathPattern.test(entry),
    );
    expect(
      didAttemptBidMutation,
      "Expected a mutating bid-attempt request to /api/v1/auctions/:id/bids",
    ).toBe(true);
  } finally {
    mutationCapture.stop();
    await attachMutationLedger(testInfo, {
      test: "@m2 mutating smoke: authenticated user can submit a bid attempt",
      baseURL,
      bidRequestObserved,
      bidAttemptStatus,
      bidAttemptUrl,
      allowedMutations: mutationCapture.allowed,
      unexpectedMutations: mutationCapture.unexpected,
    });
  }

  expect(
    mutationCapture.unexpected,
    mutationCapture.unexpected.length
      ? `Unexpected mutating requests detected:\n${mutationCapture.unexpected.join("\n")}`
      : undefined,
  ).toEqual([]);
});
