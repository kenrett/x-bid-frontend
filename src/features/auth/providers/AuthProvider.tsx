import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type MutableRefObject,
} from "react";
import { isAxiosError } from "axios";
import { AuthContext } from "../contexts/authContext";
import type { User } from "../types/user";
import type { LoginPayload } from "../types/auth";
import client from "@api/client";
import { cable, resetCable } from "@services/cable";
import { normalizeUser } from "../api/user";
import { setSentryUser } from "@sentryClient";
import { showToast } from "@services/toast";
import { authSessionStore } from "../tokenStore";

type SessionRemainingResponse = {
  remaining_seconds?: number;
  user?: User;
  is_admin?: boolean;
  is_superuser?: boolean;
};

type LoggedInResponse = {
  logged_in?: boolean;
  user?: User;
  is_admin?: boolean;
  is_superuser?: boolean;
};

const SESSION_POLL_INTERVAL_MS = 60_000;
const SESSION_EXPIRED_TOAST = "Your session expired, please log in again.";
const UNAUTHORIZED_RETRY_DELAY_MS = { min: 500, max: 1_500 };
const MAX_SERVER_ERROR_RETRIES = 5;
const MAX_SERVER_RETRY_DELAY_MS = 10_000;
const SERVER_RETRY_BASE_DELAY_MS = 500;
const SILENT_UNAUTHORIZED_REASONS = new Set([
  "missing_authorization_header",
  "missing_session_cookie",
  "missing_credentials",
  "unknown_credentials",
]);

type UnauthorizedEventDetail = {
  status?: number;
  code?: string;
  reason?: string;
  requestPath?: string;
  silent?: boolean;
};

type SessionProbeFailureKind = "unauthorized" | "server" | "network";
type SessionProbeResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: SessionProbeFailureKind };

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getJitteredDelayMs = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getServerRetryDelayMs = (attempt: number): number =>
  Math.min(
    SERVER_RETRY_BASE_DELAY_MS * 2 ** attempt,
    MAX_SERVER_RETRY_DELAY_MS,
  );

const getSessionEventName = (payload: unknown): string | undefined => {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.event === "string") return record.event;
    if (typeof record.type === "string") return record.type;
    if (typeof record.status === "string") return record.status;
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const normalizeLoggedInResponse = (
  raw: LoggedInResponse | null | undefined,
  normalizeAuthUser: (user: User) => User,
): { loggedIn: boolean; user: User | null } => {
  if (!raw || typeof raw !== "object") {
    return { loggedIn: false, user: null };
  }
  const record = asRecord(raw);
  if (!record) return { loggedIn: false, user: null };

  const loggedIn = record.logged_in !== false;
  const userRecord = asRecord(record.user);
  if (!userRecord) {
    return { loggedIn, user: null };
  }

  const normalized = normalizeAuthUser({
    ...(userRecord as unknown as User),
    is_admin:
      (record.is_admin as boolean | undefined) ??
      (userRecord as { is_admin?: boolean }).is_admin ??
      false,
    is_superuser:
      (record.is_superuser as boolean | undefined) ??
      (userRecord as { is_superuser?: boolean }).is_superuser ??
      false,
  });

  return { loggedIn, user: normalized };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const normalizeAuthUser = useCallback(
    (rawUser: User): User => normalizeUser(rawUser),
    [],
  );

  const invalidatingRef = useRef(false);
  const pendingBalanceRef = useRef<number | null>(null);
  const reconnectInFlightRef = useRef(false);
  const reconnectPromiseRef = useRef<Promise<
    SessionProbeResult<unknown>
  > | null>(null);
  const unauthorizedStreakRef = useRef(0);
  const loggedInProbeInFlightRef = useRef<Promise<
    SessionProbeResult<LoggedInResponse>
  > | null>(null);
  const remainingProbeInFlightRef = useRef<Promise<
    SessionProbeResult<SessionRemainingResponse>
  > | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<
    number | null
  >(null);
  const [isReady, setIsReady] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const userId = user?.id ?? null;

  const runSessionProbe = useCallback(
    async <T,>(
      request: () => Promise<{ data: T }>,
      inFlightRef: MutableRefObject<Promise<SessionProbeResult<T>> | null>,
    ): Promise<SessionProbeResult<T>> => {
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const pendingProbe = request()
        .then((response) => {
          unauthorizedStreakRef.current = 0;
          return { ok: true, data: response.data } as SessionProbeResult<T>;
        })
        .catch((error: unknown) => {
          if (isAxiosError(error) && error.response?.status === 401) {
            unauthorizedStreakRef.current += 1;
            return { ok: false, kind: "unauthorized" } as SessionProbeResult<T>;
          }

          unauthorizedStreakRef.current = 0;

          if (
            isAxiosError(error) &&
            typeof error.response?.status === "number" &&
            error.response.status >= 500
          ) {
            return { ok: false, kind: "server" } as SessionProbeResult<T>;
          }

          return { ok: false, kind: "network" } as SessionProbeResult<T>;
        })
        .finally(() => {
          if (inFlightRef.current === pendingProbe) {
            inFlightRef.current = null;
          }
        });

      inFlightRef.current = pendingProbe;
      return pendingProbe;
    },
    [],
  );

  const applyAuthPayload = useCallback(
    (payload: LoginPayload) => {
      invalidatingRef.current = false;
      unauthorizedStreakRef.current = 0;
      setReconnecting(false);
      const normalizedUser = normalizeAuthUser(payload.user as User);
      const nextUser =
        pendingBalanceRef.current !== null
          ? normalizeAuthUser({
              ...normalizedUser,
              bidCredits: pendingBalanceRef.current,
            })
          : normalizedUser;
      pendingBalanceRef.current = null;
      setUser(nextUser);
      setSessionRemainingSeconds(null);

      authSessionStore.setUser(nextUser);
      setSentryUser(nextUser);
      resetCable();

      if (import.meta.env.VITE_E2E_TESTS === "true") {
        (window as { __lastSessionState?: unknown }).__lastSessionState = {
          user: normalizedUser,
        };
      }
    },
    [normalizeAuthUser],
  );

  const clearAuthState = useCallback(() => {
    pendingBalanceRef.current = null;
    reconnectInFlightRef.current = false;
    reconnectPromiseRef.current = null;
    loggedInProbeInFlightRef.current = null;
    remainingProbeInFlightRef.current = null;
    unauthorizedStreakRef.current = 0;
    setReconnecting(false);
    setUser(null);
    setSessionRemainingSeconds(null);

    // Defense-in-depth: clear any legacy persisted auth artifacts.
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionTokenId");
      localStorage.removeItem("auth.session.v1");
    } catch {
      // ignore (no storage in some environments)
    }

    authSessionStore.clear();
    setSentryUser(null);
    resetCable();

    if (import.meta.env.VITE_E2E_TESTS === "true") {
      (window as { __lastSessionState?: unknown }).__lastSessionState = {
        loggedOut: true,
      };
    }
  }, []);

  const logout = useCallback(() => {
    const run = async () => {
      try {
        await client.delete("/api/v1/logout");
      } catch (error) {
        if (import.meta.env.MODE !== "test") {
          console.warn("[AuthProvider] Failed to logout", error);
        }
      } finally {
        clearAuthState();
      }
    };
    void run();
  }, [clearAuthState]);

  const handleSessionInvalidated = useCallback(
    (reason?: string) => {
      if (invalidatingRef.current) return;
      invalidatingRef.current = true;
      if (import.meta.env.MODE !== "test") {
        console.warn(
          `[AuthProvider] Session invalidated${reason ? ` (${reason})` : ""}`,
        );
      }

      // Clear local auth state immediately to avoid partial-auth UI and prevent
      // any new requests from attaching stale tokens.
      logout();

      if (!window.location.pathname.startsWith("/login")) {
        showToast(SESSION_EXPIRED_TOAST, "error");
        const redirectParam = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        const targetUrl = `/login?next=${redirectParam}&redirect=${redirectParam}&reason=session_expired`;
        if (import.meta.env.MODE === "test") {
          (window as { __lastRedirect?: string }).__lastRedirect = targetUrl;
        } else {
          try {
            window.history.pushState({}, "", targetUrl);
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch {
            window.location.assign(targetUrl);
          }
        }
      }
    },
    [logout],
  );

  const recoverFromProbeFailure = useCallback(
    async <T,>(
      initialFailureKind: SessionProbeFailureKind,
      probe: () => Promise<SessionProbeResult<T>>,
    ): Promise<SessionProbeResult<T>> => {
      if (reconnectPromiseRef.current) {
        return (await reconnectPromiseRef.current) as SessionProbeResult<T>;
      }

      const reconnectPromise = (async (): Promise<SessionProbeResult<T>> => {
        reconnectInFlightRef.current = true;
        setReconnecting(true);

        let failureKind: SessionProbeFailureKind = initialFailureKind;
        let serverAttemptCount = 0;

        while (true) {
          if (failureKind === "unauthorized") {
            await wait(
              getJitteredDelayMs(
                UNAUTHORIZED_RETRY_DELAY_MS.min,
                UNAUTHORIZED_RETRY_DELAY_MS.max,
              ),
            );
            const unauthorizedRetry = await probe();
            if (unauthorizedRetry.ok) {
              setReconnecting(false);
              return unauthorizedRetry;
            }

            if (
              unauthorizedRetry.kind === "unauthorized" &&
              unauthorizedStreakRef.current >= 2
            ) {
              handleSessionInvalidated("unauthorized");
              return unauthorizedRetry;
            }

            failureKind = unauthorizedRetry.kind;
            continue;
          }

          while (serverAttemptCount < MAX_SERVER_ERROR_RETRIES) {
            await wait(getServerRetryDelayMs(serverAttemptCount));
            const serverRetry = await probe();

            if (serverRetry.ok) {
              setReconnecting(false);
              return serverRetry;
            }

            serverAttemptCount += 1;

            if (
              serverRetry.kind === "unauthorized" &&
              unauthorizedStreakRef.current >= 2
            ) {
              handleSessionInvalidated("unauthorized");
              return serverRetry;
            }

            if (serverRetry.kind === "unauthorized") {
              failureKind = "unauthorized";
              break;
            }

            failureKind = serverRetry.kind;
          }

          if (
            failureKind !== "unauthorized" &&
            serverAttemptCount >= MAX_SERVER_ERROR_RETRIES
          ) {
            if (import.meta.env.MODE !== "test") {
              console.warn(
                "[AuthProvider] Backend unavailable, keeping session cookies and reconnecting.",
              );
            }
            return { ok: false, kind: failureKind };
          }
        }
      })();

      reconnectPromiseRef.current = reconnectPromise as Promise<
        SessionProbeResult<unknown>
      >;
      try {
        return await reconnectPromise;
      } finally {
        reconnectInFlightRef.current = false;
        reconnectPromiseRef.current = null;
      }
    },
    [handleSessionInvalidated],
  );

  const runProbeWithRecovery = useCallback(
    async <T,>(
      probe: () => Promise<SessionProbeResult<T>>,
    ): Promise<SessionProbeResult<T>> => {
      const result = await probe();
      if (result.ok) {
        setReconnecting(false);
        return result;
      }
      return recoverFromProbeFailure(result.kind, probe);
    },
    [recoverFromProbeFailure],
  );

  const probeLoggedIn = useCallback(
    () =>
      runSessionProbe<LoggedInResponse>(
        () => client.get<LoggedInResponse>("/api/v1/logged_in"),
        loggedInProbeInFlightRef,
      ),
    [runSessionProbe],
  );

  const probeSessionRemaining = useCallback(
    () =>
      runSessionProbe<SessionRemainingResponse>(
        () =>
          client.get<SessionRemainingResponse>("/api/v1/session/remaining", {}),
        remainingProbeInFlightRef,
      ),
    [runSessionProbe],
  );

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        if (import.meta.env.VITE_DEBUG_AUTH) {
          console.info("[auth debug] bootstrap logged_in start", {
            hasUser: Boolean(authSessionStore.getSnapshot().user),
          });
        }
        const result = await runProbeWithRecovery(probeLoggedIn);
        if (cancelled) return;
        if (!result.ok) {
          return;
        }

        const { loggedIn, user: nextUser } = normalizeLoggedInResponse(
          result.data,
          normalizeAuthUser,
        );
        if (!loggedIn || !nextUser) {
          clearAuthState();
        } else {
          const resolvedUser =
            pendingBalanceRef.current !== null
              ? normalizeAuthUser({
                  ...nextUser,
                  bidCredits: pendingBalanceRef.current,
                })
              : nextUser;
          pendingBalanceRef.current = null;
          setUser(resolvedUser);
          authSessionStore.setUser(resolvedUser);
          setSentryUser(resolvedUser);
          resetCable();
        }
      } catch (error) {
        if (cancelled) return;
        if (import.meta.env.MODE !== "test") {
          console.error("[AuthProvider] Failed to bootstrap session", error);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearAuthState, normalizeAuthUser, probeLoggedIn, runProbeWithRecovery]);

  const login = useCallback(
    ({ user }: LoginPayload) => {
      applyAuthPayload({
        user,
      });
    },
    [applyAuthPayload],
  );

  const updateUserBalance = useCallback(
    (newBalance: number) => {
      setUser((currentUser) => {
        if (!currentUser) {
          pendingBalanceRef.current = newBalance;
          return null;
        }
        const updatedUser = { ...currentUser, bidCredits: newBalance };
        const normalized = normalizeAuthUser(updatedUser);
        authSessionStore.setUser(normalized);
        return normalized;
      });
    },
    [normalizeAuthUser],
  );

  const updateUser = useCallback(
    (updater: (current: User) => User) => {
      setUser((currentUser) => {
        if (!currentUser) return null;
        const updated = normalizeAuthUser(updater(currentUser));
        setSentryUser(updated);
        authSessionStore.setUser(updated);
        return updated;
      });
    },
    [normalizeAuthUser],
  );
  useEffect(() => {
    if (!userId) {
      setSessionRemainingSeconds(null);
      return;
    }

    const isE2E = import.meta.env.VITE_E2E_TESTS === "true";
    let cancelled = false;
    let intervalId: number | null = null;

    const handleRemainingResponse = (
      data: SessionRemainingResponse | null | undefined,
    ) => {
      if (cancelled || !data) return;

      const {
        remaining_seconds,
        user: refreshedUser,
        is_admin: refreshedAdminFlag,
        is_superuser: refreshedSuperFlag,
      } = data;

      const remaining =
        typeof remaining_seconds === "number" ? remaining_seconds : null;

      if (typeof remaining === "number") {
        setSessionRemainingSeconds(remaining);
        if (remaining <= 0) {
          handleSessionInvalidated("expired");
          return;
        }
      } else {
        // If the backend doesn't send remaining_seconds, keep the session alive
        // and clear the countdown rather than invalidating/loggin the user out
        setSessionRemainingSeconds(null);
      }

      if (
        refreshedUser ||
        typeof refreshedAdminFlag === "boolean" ||
        typeof refreshedSuperFlag === "boolean"
      ) {
        setUser((currentUser) => {
          const baseUser = refreshedUser ?? currentUser;
          if (!baseUser) return currentUser;

          const mergedUser = normalizeUser({
            ...baseUser,
            ...(refreshedUser ?? {}),
            is_admin:
              (refreshedUser ?? baseUser).is_admin ??
              refreshedAdminFlag ??
              currentUser?.is_admin,
            is_superuser:
              (refreshedUser ?? baseUser).is_superuser ??
              refreshedSuperFlag ??
              currentUser?.is_superuser,
          } as User);
          authSessionStore.setUser(mergedUser);
          return mergedUser;
        });
      }

      if (isE2E) {
        (window as { __lastSessionState?: unknown }).__lastSessionState = {
          remaining,
          user: authSessionStore.getSnapshot().user,
        };
      }
    };

    const fetchRemaining = async (override?: SessionRemainingResponse) => {
      try {
        if (override) {
          handleRemainingResponse(override);
          return;
        }
        const result = await runProbeWithRecovery(probeSessionRemaining);
        if (cancelled || !result.ok) return;
        handleRemainingResponse(result.data);
      } catch (error) {
        if (import.meta.env.MODE !== "test") {
          console.error("Failed to fetch session remaining time", error);
        }
      }
    };

    if (isE2E) {
      (
        window as {
          __triggerSessionPoll?: (
            override?: SessionRemainingResponse,
          ) => Promise<void>;
        }
      ).__triggerSessionPoll = (override?: SessionRemainingResponse) =>
        fetchRemaining(override);
    }

    void fetchRemaining();
    intervalId = window.setInterval(fetchRemaining, SESSION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (isE2E) {
        delete (window as { __triggerSessionPoll?: () => Promise<void> })
          .__triggerSessionPoll;
      }
    };
  }, [
    userId,
    handleSessionInvalidated,
    probeSessionRemaining,
    runProbeWithRecovery,
  ]);

  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      const detail = (event as CustomEvent<UnauthorizedEventDetail>).detail;
      if (detail?.silent) {
        clearAuthState();
        return;
      }

      if (
        !authSessionStore.getSnapshot().user &&
        detail?.reason &&
        SILENT_UNAUTHORIZED_REASONS.has(detail.reason.toLowerCase())
      ) {
        clearAuthState();
        return;
      }

      handleSessionInvalidated("unauthorized");
    };
    window.addEventListener("app:unauthorized", onUnauthorized);
    return () => window.removeEventListener("app:unauthorized", onUnauthorized);
  }, [clearAuthState, handleSessionInvalidated]);

  useEffect(() => {
    const onRefreshed = (event: Event) => {
      const { detail } = event as CustomEvent<LoginPayload>;
      if (!detail) return;
      applyAuthPayload(detail);
    };

    window.addEventListener("app:auth:refreshed", onRefreshed);
    return () => window.removeEventListener("app:auth:refreshed", onRefreshed);
  }, [applyAuthPayload]);

  useEffect(() => {
    if (!user) return;

    const subscription = cable.subscriptions.create(
      {
        channel: "SessionChannel",
      },
      {
        received: (payload: unknown) => {
          const eventName = getSessionEventName(payload);
          if (eventName === "session_invalidated") {
            handleSessionInvalidated("broadcast");
          }
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, handleSessionInvalidated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionRemainingSeconds,
        isReady,
        reconnecting,
        login,
        logout,
        updateUser,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
