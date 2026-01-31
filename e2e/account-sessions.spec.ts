import { expect, test } from "./fixtures/test";
import {
  authedUser,
  fulfillJson,
  mockSessionRemaining,
  seedAuthState,
} from "./fixtures/mocks";

const currentSession = {
  id: 35,
  created_at: "2025-01-01T00:00:00Z",
  last_seen_at: "2025-01-01T01:00:00Z",
  user_agent: "Current device",
  ip_address: "127.0.0.1",
  current: true,
};

const otherSession = {
  id: 36,
  created_at: "2025-01-01T00:00:00Z",
  last_seen_at: "2025-01-02T01:00:00Z",
  user_agent: "Other device",
  ip_address: "127.0.0.2",
  current: false,
};

test("revoke other sessions removes them from the list", async ({ page }) => {
  await seedAuthState(page, authedUser);
  await mockSessionRemaining(page, authedUser);

  let sessions = [currentSession, otherSession];

  await page.route("**/api/v1/account/sessions", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return fulfillJson(route, { sessions });
  });

  await page.route("**/api/v1/account/sessions/revoke_others", (route) => {
    sessions = [currentSession];
    return fulfillJson(route, { ok: true });
  });

  await page.goto("/account/sessions");

  await expect(
    page.getByTestId("session-card-35").getByText("Current device"),
  ).toBeVisible();
  await expect(
    page.getByTestId("session-card-36").getByText("Other device"),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /sign out of other devices/i })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign out" })
    .click();

  await expect(
    page.getByTestId("session-card-36").getByText("Other device"),
  ).toHaveCount(0);
});
