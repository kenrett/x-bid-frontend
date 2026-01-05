type SentryModule = typeof import("@sentry/react");

const parseRate = (value: unknown, fallback: number) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
};

const dsn = import.meta.env.VITE_SENTRY_DSN;
const isTestEnv = import.meta.env.MODE === "test";

// Keep Sentry out of the initial bundle: only dynamically import it in production.
export const SENTRY_ENABLED =
  Boolean(dsn) && import.meta.env.PROD && !isTestEnv;

let sentryModule: SentryModule | null = null;
let sentryPromise: Promise<SentryModule | null> | null = null;
let pendingUser:
  | { id: number; email?: string; name?: string }
  | null
  | undefined = undefined;

const applyUser = (
  mod: SentryModule,
  user: { id: number; email?: string; name?: string } | null,
) => {
  if (user) {
    mod.setUser({
      id: String(user.id),
      email: user.email,
      username: user.name,
    });
  } else {
    mod.setUser(null);
  }
};

export const initSentry = async (): Promise<SentryModule | null> => {
  if (!SENTRY_ENABLED) return null;
  if (sentryModule) return sentryModule;

  sentryPromise ??= import("@sentry/react")
    .then((mod) => {
      sentryModule = mod;
      mod.init({
        dsn,
        environment:
          import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
        release:
          import.meta.env.VITE_SENTRY_RELEASE ??
          `x-bid-frontend@${import.meta.env.VITE_APP_VERSION ?? "0.0.0"}`,
        integrations: [
          mod.browserTracingIntegration(),
          mod.replayIntegration({
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

      if (pendingUser !== undefined) {
        applyUser(mod, pendingUser);
      }
      return mod;
    })
    .catch((error) => {
      console.warn("[sentry] Failed to initialize", error);
      return null;
    });

  return sentryPromise;
};

export const setSentryUser = (
  user: { id: number; email?: string; name?: string } | null,
) => {
  pendingUser = user;
  if (!SENTRY_ENABLED || !sentryModule) return;
  try {
    applyUser(sentryModule, user);
  } catch (error) {
    console.warn("[sentry] Failed to set user", error);
  }
};

export const Sentry = {
  withScope: (cb: (scope: unknown) => void) => {
    if (!SENTRY_ENABLED || !sentryModule) return;
    (
      sentryModule as unknown as {
        withScope: (cb: (scope: unknown) => void) => void;
      }
    ).withScope(cb);
  },
  captureException: (error: unknown) => {
    if (!SENTRY_ENABLED || !sentryModule) return;
    sentryModule.captureException(error);
  },
  captureMessage: (
    message: string,
    context?: Parameters<SentryModule["captureMessage"]>[1],
  ) => {
    if (!SENTRY_ENABLED || !sentryModule) return;
    sentryModule.captureMessage(message, context);
  },
};
