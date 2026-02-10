import { defineConfig, devices } from "@playwright/test";

const prodBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

if (!prodBaseUrl) {
  throw new Error(
    "PLAYWRIGHT_BASE_URL is required for prod smoke tests (example: https://www.biddersweet.app).",
  );
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.prod-smoke.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: "list",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: prodBaseUrl,
    bypassCSP: false,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: (process.env.PLAYWRIGHT_VIDEO_MODE ?? "retain-on-failure") as
      | "off"
      | "on"
      | "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
