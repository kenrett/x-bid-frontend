import { expect, test } from "./fixtures/test";
import { fulfillJson, loginResponse } from "./fixtures/mocks";

test("inline 2fa login retries /api/v1/login with otp and signs in", async ({
  page,
}) => {
  await page.route("**/api/v1/login", (route) => {
    if (route.request().method() !== "POST") return route.continue();

    const body = route.request().postDataJSON() as {
      otp?: string;
      recovery_code?: string;
    };

    if (!body.otp && !body.recovery_code) {
      return fulfillJson(
        route,
        {
          error: {
            code: "two_factor_required",
            message: "Two-factor authentication required",
          },
        },
        401,
      );
    }

    return fulfillJson(route, loginResponse);
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("casey@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page.getByLabel(/authenticator code/i)).toBeVisible();

  await page.getByLabel(/authenticator code/i).fill("123456");
  await page.getByRole("button", { name: /verify and sign in/i }).click();

  await expect(page).toHaveURL(/\/auctions/);
});
