import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
    bypassCSP: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run build && vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    // Default to a clean server so Playwright-controlled env vars (Stripe key, E2E flags)
    // are always applied. Opt into reuse via PLAYWRIGHT_REUSE_SERVER=true.
    reuseExistingServer:
      process.env.PLAYWRIGHT_REUSE_SERVER === "true" && !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_API_BASE_URL: (() => {
        const raw = process.env.VITE_API_BASE_URL ?? "http://api.lvh.me:3000";
        return raw.replace(/\/+api\/v1\/?$/i, "");
      })(),
      VITE_STRIPE_PUBLISHABLE_KEY:
        process.env.VITE_STRIPE_PUBLISHABLE_KEY ??
        "pk_test_123456789012345678901234567890",
      VITE_E2E_TESTS: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
