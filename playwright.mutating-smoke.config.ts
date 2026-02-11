import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";
import { loadProdSmokeTargets } from "./e2e/prod/targets";

const loadedEnv = loadEnv(process.env.NODE_ENV ?? "test", process.cwd(), "");
for (const [key, value] of Object.entries(loadedEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const preset = (process.env.MUTATING_SMOKE_PRESET ?? "deep").toLowerCase();
const rawMutatingTargets = process.env.MUTATING_SMOKE_TARGETS;
if (rawMutatingTargets && rawMutatingTargets.trim() !== "") {
  process.env.PROD_SMOKE_TARGETS = rawMutatingTargets;
}

const targets = loadProdSmokeTargets();

if (targets.length === 0) {
  throw new Error(
    "No mutating smoke targets configured. Set MUTATING_SMOKE_TARGETS or PROD_SMOKE_TARGETS.",
  );
}

const isProdHost = (hostname: string): boolean =>
  hostname === "biddersweet.app" || hostname.endsWith(".biddersweet.app");

const touchesProd = targets.some((target) => {
  const hostname = new URL(target.baseURL).hostname.toLowerCase();
  return isProdHost(hostname);
});

if (touchesProd && process.env.MUTATING_SMOKE_ALLOW_PROD !== "true") {
  throw new Error(
    'Mutating smoke targets include biddersweet.app hosts. Set MUTATING_SMOKE_ALLOW_PROD="true" to proceed intentionally.',
  );
}

const grepByPreset: Record<string, RegExp | undefined> = {
  fast: /@m0/,
  standard: /@m0|@m1/,
  deep: undefined,
};

if (!(preset in grepByPreset)) {
  throw new Error(
    `Invalid MUTATING_SMOKE_PRESET "${preset}". Use "fast", "standard", or "deep".`,
  );
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.mutating-smoke.spec.ts",
  grep: grepByPreset[preset],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
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
