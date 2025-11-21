import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
import { AuthContext } from "../contexts/authContext";
import type { User } from "../types/user";
import type { LoginPayload } from "../types/auth";
import client from "../api/client";
import { cable } from "@/services/cable";

type SessionRemainingResponse = {
  remaining_seconds?: number;
  token?: string;
  refresh_token?: string;
  session_token_id?: string;
};

const SESSION_POLL_INTERVAL_MS = 60_000;

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessionTokenId, setSessionTokenId] = useState<string | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedSessionTokenId = localStorage.getItem("sessionTokenId");
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("user");
      }
    }

    if (storedToken) setToken(storedToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);
    if (storedSessionTokenId) setSessionTokenId(storedSessionTokenId);
  }, []);

  const persistValue = useCallback((key: string, value: string | null) => {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }, []);

  const login = useCallback(({ token: jwt, refreshToken: refresh, sessionTokenId: sessionId, user }: LoginPayload) => {
    setUser(user);
    setToken(jwt);
    setRefreshToken(refresh);
    setSessionTokenId(sessionId);
    setSessionRemainingSeconds(null);

    localStorage.setItem("user", JSON.stringify(user));
    persistValue("token", jwt);
    persistValue("refreshToken", refresh);
    persistValue("sessionTokenId", sessionId);
  }, [persistValue]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setSessionTokenId(null);
    setSessionRemainingSeconds(null);

    localStorage.removeItem("user");
    persistValue("token", null);
    persistValue("refreshToken", null);
    persistValue("sessionTokenId", null);
  }, [persistValue]);

  const handleSessionInvalidated = useCallback((reason?: string) => {
    console.warn(`[AuthProvider] Session invalidated${reason ? ` (${reason})` : ""}`);
    logout();
  }, [logout]);

  const updateUserBalance = useCallback((newBalance: number) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, bidCredits: newBalance };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  useEffect(() => {
    if (!token || !sessionTokenId) {
      setSessionRemainingSeconds(null);
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    const fetchRemaining = async () => {
      try {
        const response = await client.get<SessionRemainingResponse>("/session/remaining", {
          params: { session_token_id: sessionTokenId },
        });
        if (cancelled) return;

        const {
          remaining_seconds,
          token: nextToken,
          refresh_token: nextRefreshToken,
          session_token_id: nextSessionTokenId,
        } = response.data;

        if (typeof remaining_seconds === "number") {
          setSessionRemainingSeconds(remaining_seconds);
          if (remaining_seconds <= 0) {
            handleSessionInvalidated("expired");
            return;
          }
        }

        if (nextToken && nextRefreshToken && nextSessionTokenId) {
          setToken(nextToken);
          persistValue("token", nextToken);
          setRefreshToken(nextRefreshToken);
          persistValue("refreshToken", nextRefreshToken);
          setSessionTokenId(nextSessionTokenId);
          persistValue("sessionTokenId", nextSessionTokenId);
        }
      } catch (error) {
        console.error("Failed to fetch session remaining time", error);
        if (isAxiosError(error) && error.response?.status === 401) {
          handleSessionInvalidated("unauthorized");
        }
      }
    };

    void fetchRemaining();
    intervalId = window.setInterval(fetchRemaining, SESSION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [token, sessionTokenId, handleSessionInvalidated, persistValue]);

  useEffect(() => {
    if (!token || !sessionTokenId) return;

    const subscription = cable.subscriptions.create(
      { channel: "SessionChannel", token, session_token_id: sessionTokenId },
      {
        received: (payload: unknown) => {
          const eventName = getSessionEventName(payload);
          if (eventName === "session_invalidated") {
            handleSessionInvalidated("broadcast");
          }
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [token, sessionTokenId, handleSessionInvalidated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        sessionTokenId,
        sessionRemainingSeconds,
        login,
        logout,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
