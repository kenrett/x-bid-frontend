import { defineConfig, devices } from "@playwright/test";
import { loadProdSmokeTargets } from "./e2e/prod/targets";

const preset = (process.env.PROD_SMOKE_PRESET ?? "deep").toLowerCase();
const targets = loadProdSmokeTargets();

if (targets.length === 0) {
  throw new Error(
    "No prod smoke targets configured. Set PROD_SMOKE_TARGETS or use defaults.",
  );
}

const grepByPreset: Record<string, RegExp | undefined> = {
  fast: /@p0/,
  standard: /@p0|@p1/,
  deep: undefined,
};

if (!(preset in grepByPreset)) {
  throw new Error(
    `Invalid PROD_SMOKE_PRESET "${preset}". Use "fast", "standard", or "deep".`,
  );
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.prod-smoke.spec.ts",
  grep: grepByPreset[preset],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: "list",
  retries: process.env.CI ? 1 : 0,
  projects: targets.map((target) => ({
    name: `chromium-${target.key}`,
    use: {
      ...devices["Desktop Chrome"],
      baseURL: target.baseURL,
      bypassCSP: false,
      trace: "retain-on-failure",
      screenshot: "only-on-failure",
      video: (process.env.PLAYWRIGHT_VIDEO_MODE ?? "retain-on-failure") as
        | "off"
        | "on"
        | "retain-on-failure",
    },
  })),
});
