import { expect, test } from "@playwright/test";
import { acceptAgeGateIfPresent, resolveAuctionsState } from "./prod/flows";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_MUTATING_PATHS = [/\/api\/v1\/age_gate\/accept(?:[/?#]|$)/i];

const getRootDomain = (hostname: string): string => {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
};

const isSameAppDomain = (candidateHostname: string, baseHostname: string) => {
  if (candidateHostname === baseHostname) return true;
  const root = getRootDomain(baseHostname);
  return candidateHostname === root || candidateHostname.endsWith(`.${root}`);
};

test("@p2 prod smoke: read-only auction browsing does not mutate server state", async ({
  page,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Missing baseURL for prod smoke project configuration.");
  }

  const baseHostname = new URL(baseURL).hostname;
  const mutatingRequests: string[] = [];

  page.on("request", (request) => {
    if (!MUTATING_METHODS.has(request.method())) return;

    const url = new URL(request.url());
    if (!isSameAppDomain(url.hostname, baseHostname)) return;
    if (ALLOWED_MUTATING_PATHS.some((pattern) => pattern.test(url.pathname))) {
      return;
    }

    mutatingRequests.push(`${request.method()} ${url.toString()}`);
  });

  const response = await page.goto("/auctions", {
    waitUntil: "domcontentloaded",
  });
  expect(response, "Missing /auctions document response").not.toBeNull();
  expect(response?.ok(), `Non-2xx response: ${response?.status()}`).toBe(true);
  await expect(page.locator("main")).toBeVisible();

  const state = await resolveAuctionsState(page);
  if (state.kind === "session_expired") {
    test.skip(
      true,
      `Blocked: guest auctions route is redirecting to login (${state.message}).`,
    );
  }
  if (state.kind === "error") {
    throw new Error(`Auctions page rendered an error alert: ${state.message}`);
  }
  if (state.kind === "loading" || state.kind === "unknown") {
    throw new Error(state.message);
  }

  if (state.kind === "cards") {
    await acceptAgeGateIfPresent(page);
    await page.locator('[data-testid^="auction-card-"]').first().click();
    await expect(page).toHaveURL(/\/auctions\/\d+/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading").first()).toBeVisible();
  } else {
    await expect(page.getByText("No auctions found.")).toBeVisible();
  }

  expect(
    mutatingRequests,
    mutatingRequests.length
      ? `Mutating requests were detected during read-only journey:\n${mutatingRequests.join("\n")}`
      : undefined,
  ).toEqual([]);
});
