import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  browserTracingIntegration: vi.fn(() => "browserTracingIntegration"),
  replayIntegration: vi.fn((options) => ({
    integration: "replayIntegration",
    options,
  })),
}));

const originalEnv = { ...import.meta.env };

const applyEnv = (overrides: Record<string, unknown>) => {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(originalEnv),
    ...Object.keys(overrides),
  ]);
  for (const key of keys) {
    env[key] =
      key in overrides
        ? overrides[key]
        : (originalEnv as Record<string, unknown>)[key];
  }
};

const loadSentryClient = async (overrides: Record<string, unknown>) => {
  vi.resetModules();
  applyEnv(overrides);
  return import("./sentryClient");
};

describe("sentryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyEnv({});
  });

  afterEach(() => {
    applyEnv({});
  });

  it("does not initialize when no DSN is provided", async () => {
    const sentry = await import("@sentry/react");
    const module = await loadSentryClient({
      VITE_SENTRY_DSN: "",
      MODE: "development",
    });

    expect(module.SENTRY_ENABLED).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();

    module.setSentryUser({ id: 1 });
    expect(sentry.setUser).not.toHaveBeenCalled();
  });

  it("skips initialization in test mode even with a DSN", async () => {
    const sentry = await import("@sentry/react");
    const module = await loadSentryClient({
      VITE_SENTRY_DSN: "https://dsn.example",
      MODE: "test",
    });

    expect(module.SENTRY_ENABLED).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("initializes Sentry and sets user when enabled", async () => {
    const sentry = await import("@sentry/react");
    const module = await loadSentryClient({
      VITE_SENTRY_DSN: "https://dsn.example",
      MODE: "production",
      VITE_SENTRY_ENVIRONMENT: "staging",
      VITE_SENTRY_RELEASE: "release-123",
      VITE_APP_VERSION: "9.9.9",
      VITE_SENTRY_TRACES_SAMPLE_RATE: "0.3",
      VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: "0.2",
      VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: "0.8",
    });

    expect(module.SENTRY_ENABLED).toBe(true);
    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith({
      dsn: "https://dsn.example",
      environment: "staging",
      release: "release-123",
      integrations: [
        "browserTracingIntegration",
        {
          integration: "replayIntegration",
          options: { maskAllText: false, blockAllMedia: true },
        },
      ],
      tracesSampleRate: 0.3,
      replaysSessionSampleRate: 0.2,
      replaysOnErrorSampleRate: 0.8,
      normalizeDepth: 6,
    });

    module.setSentryUser({ id: 42, email: "user@example.com", name: "User" });
    expect(sentry.setUser).toHaveBeenLastCalledWith({
      id: "42",
      email: "user@example.com",
      username: "User",
    });

    module.setSentryUser(null);
    expect(sentry.setUser).toHaveBeenLastCalledWith(null);
  });
});
