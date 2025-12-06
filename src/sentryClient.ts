import * as Sentry from "@sentry/react";

const parseRate = (value: unknown, fallback: number) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
};

const dsn = import.meta.env.VITE_SENTRY_DSN;

const isTestEnv = import.meta.env.MODE === "test";

export const SENTRY_ENABLED = Boolean(dsn) && !isTestEnv;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release:
      import.meta.env.VITE_SENTRY_RELEASE ??
      `x-bid-frontend@${import.meta.env.VITE_APP_VERSION ?? "0.0.0"}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: parseRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
    replaysSessionSampleRate: parseRate(
      import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0.0,
    ),
    replaysOnErrorSampleRate: parseRate(
      import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      0.1,
    ),
    normalizeDepth: 6,
  });
}

export const setSentryUser = (user: { id: number; email?: string; name?: string } | null) => {
  if (!SENTRY_ENABLED) return;
  if (user) {
    Sentry.setUser({
      id: String(user.id),
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

export { Sentry };
