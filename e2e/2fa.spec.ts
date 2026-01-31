import { expect, test } from "./fixtures/test";
import { fulfillJson, loginResponse } from "./fixtures/mocks";

test("2fa challenge flow verifies and signs in", async ({ page }) => {
  await page.route("**/api/v1/login", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return fulfillJson(route, {
      two_factor_required: true,
      challenge_id: "challenge-1",
      email_address: "casey@example.com",
    });
  });

  await page.route("**/api/v1/2fa/verify", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return fulfillJson(route, loginResponse);
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(
    page.getByRole("heading", { name: /enter your authentication code/i }),
  ).toBeVisible();

  await page.getByLabel(/authenticator code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();

  await expect(page).toHaveURL(/\/auctions/);
});
