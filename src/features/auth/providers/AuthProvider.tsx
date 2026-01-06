import { useState, useEffect, useCallback, useRef } from "react";
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
  access_token?: string;
  refresh_token?: string;
  session_token_id?: string | number;
  user?: User;
  is_admin?: boolean;
  is_superuser?: boolean;
};

const SESSION_POLL_INTERVAL_MS = 60_000;
const SESSION_EXPIRED_TOAST = "Your session expired, please log in again.";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const normalizeAuthUser = useCallback(
    (rawUser: User): User => normalizeUser(rawUser),
    [],
  );

  const invalidatingRef = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessionTokenId, setSessionTokenId] = useState<string | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<
    number | null
  >(null);
  const [isReady, setIsReady] = useState(false);

  const applyAuthPayload = useCallback(
    (payload: LoginPayload) => {
      invalidatingRef.current = false;
      const normalizedUser = normalizeAuthUser(payload.user as User);
      setUser(normalizedUser);
      setAccessToken(payload.accessToken);
      setRefreshToken(payload.refreshToken);
      setSessionTokenId(payload.sessionTokenId);
      setSessionRemainingSeconds(null);

      authSessionStore.setSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        sessionTokenId: payload.sessionTokenId,
        user: normalizedUser,
      });
      setSentryUser(normalizedUser);
      resetCable();

      if (import.meta.env.VITE_E2E_TESTS === "true") {
        (window as { __lastSessionState?: unknown }).__lastSessionState = {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          sessionTokenId: payload.sessionTokenId,
          user: normalizedUser,
        };
      }
    },
    [normalizeAuthUser],
  );

  useEffect(() => {
    const hasPersistedSession = authSessionStore.hasPersistedSession();
    const hydrated = authSessionStore.hydrateFromStorage();
    if (hydrated && hydrated.user) {
      applyAuthPayload({
        accessToken: hydrated.accessToken!,
        refreshToken: hydrated.refreshToken!,
        sessionTokenId: hydrated.sessionTokenId!,
        user: hydrated.user,
      });
    } else if (hasPersistedSession) {
      authSessionStore.clear();
      const redirectParam = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      const targetUrl = `/login?next=${redirectParam}&redirect=${redirectParam}`;
      if (!window.location.pathname.startsWith("/login")) {
        if (import.meta.env.MODE === "test") {
          (window as { __lastRedirect?: string }).__lastRedirect = targetUrl;
        } else {
          window.location.assign(targetUrl);
        }
      }
    }
    setIsReady(true);
  }, [applyAuthPayload]);

  const login = useCallback(
    ({ accessToken, refreshToken, sessionTokenId, user }: LoginPayload) => {
      applyAuthPayload({
        accessToken,
        refreshToken,
        sessionTokenId,
        user,
      });
    },
    [applyAuthPayload],
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSessionTokenId(null);
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

  const updateUserBalance = useCallback(
    (newBalance: number) => {
      setUser((currentUser) => {
        if (!currentUser) return null;
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
    if (!accessToken || !sessionTokenId) {
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
        access_token: nextAccessToken,
        refresh_token: nextRefreshToken,
        session_token_id: nextSessionTokenId,
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

      const tokenChanged = nextAccessToken && nextAccessToken !== accessToken;
      const sessionChanged =
        nextSessionTokenId &&
        String(nextSessionTokenId) !== String(sessionTokenId);

      const normalizedSessionTokenId =
        nextSessionTokenId !== undefined && nextSessionTokenId !== null
          ? String(nextSessionTokenId)
          : null;

      if (nextAccessToken && nextRefreshToken && normalizedSessionTokenId) {
        setAccessToken(nextAccessToken);
        authSessionStore.setTokens({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          sessionTokenId: normalizedSessionTokenId,
        });
        setRefreshToken(nextRefreshToken);
        setSessionTokenId(normalizedSessionTokenId);

        if (tokenChanged || sessionChanged) {
          resetCable();
        }
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
          accessToken: nextAccessToken ?? accessToken,
          refreshToken: nextRefreshToken ?? refreshToken,
          sessionTokenId: normalizedSessionTokenId ?? sessionTokenId,
          remaining,
          user: user ?? null,
        };
      }
    };

    const fetchRemaining = async (override?: SessionRemainingResponse) => {
      try {
        if (override) {
          handleRemainingResponse(override);
          return;
        }
        const response = await client.get<SessionRemainingResponse>(
          "/api/v1/session/remaining",
          {
            params: { session_token_id: sessionTokenId },
          },
        );
        handleRemainingResponse(response.data);
      } catch (error) {
        if (import.meta.env.MODE !== "test") {
          console.error("Failed to fetch session remaining time", error);
        }
        if (isAxiosError(error) && error.response?.status === 401) {
          handleSessionInvalidated("unauthorized");
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
    accessToken,
    sessionTokenId,
    handleSessionInvalidated,
    refreshToken,
    user,
  ]);

  useEffect(() => {
    const onUnauthorized = () => handleSessionInvalidated("unauthorized");
    window.addEventListener("app:unauthorized", onUnauthorized);
    return () => window.removeEventListener("app:unauthorized", onUnauthorized);
  }, [handleSessionInvalidated]);

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
    if (!accessToken || !sessionTokenId) return;

    const subscription = cable.subscriptions.create(
      {
        channel: "SessionChannel",
        token: accessToken,
        session_token_id: sessionTokenId,
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
  }, [accessToken, sessionTokenId, handleSessionInvalidated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        sessionTokenId,
        sessionRemainingSeconds,
        isReady,
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
