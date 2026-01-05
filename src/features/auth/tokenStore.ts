import type { User } from "./types/user";

export type AuthSessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  sessionTokenId: string | null;
  user: User | null;
};

type Listener = () => void;

const AUTH_STORAGE_KEY = "auth.session.v1";

let snapshot: AuthSessionSnapshot = {
  accessToken: null,
  refreshToken: null,
  sessionTokenId: null,
  user: null,
};
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener();
};

/**
 * Central auth session store used by non-React modules (Axios, ActionCable) and
 * AuthProvider hydration.
 *
 * Auth Contract v1 persisted shape:
 * `{ access_token, refresh_token, session_token_id, user }`
 */
const readNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const readSessionTokenId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  return readNonEmptyString(value);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const isCompleteSession = (value: AuthSessionSnapshot): boolean =>
  Boolean(
    value.accessToken &&
    value.refreshToken &&
    value.sessionTokenId &&
    value.user,
  );

const persist = (value: AuthSessionSnapshot) => {
  try {
    if (!isCompleteSession(value)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        access_token: value.accessToken,
        refresh_token: value.refreshToken,
        session_token_id: value.sessionTokenId,
        user: value.user,
      }),
    );
  } catch {
    // ignore (no storage in some environments)
  }
};

const clearPersisted = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore (no storage in some environments)
  }
};

export const authSessionStore = {
  getSnapshot: (): AuthSessionSnapshot => snapshot,
  hasCompleteSession: (): boolean => isCompleteSession(snapshot),
  hasPersistedSession: (): boolean => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },
  hydrateFromStorage: (): AuthSessionSnapshot | null => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      const record = asRecord(parsed);
      if (!record) throw new Error("expected JSON object");

      const accessToken = readNonEmptyString(record.access_token);
      const refreshToken = readNonEmptyString(record.refresh_token);
      const sessionTokenId = readSessionTokenId(record.session_token_id);
      const userRecord = asRecord(record.user);

      const missing: string[] = [];
      if (!accessToken) missing.push("access_token");
      if (!refreshToken) missing.push("refresh_token");
      if (!sessionTokenId) missing.push("session_token_id");
      if (!userRecord) missing.push("user");

      if (missing.length) {
        throw new Error(`missing required field(s): ${missing.join(", ")}`);
      }

      const next: AuthSessionSnapshot = {
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        sessionTokenId: sessionTokenId!,
        user: userRecord as unknown as User,
      };

      snapshot = next;
      emit();
      return next;
    } catch (error) {
      clearPersisted();
      snapshot = {
        accessToken: null,
        refreshToken: null,
        sessionTokenId: null,
        user: null,
      };
      emit();
      if (import.meta.env.MODE !== "test") {
        console.error(
          "[authSessionStore] Failed to hydrate auth session",
          error,
        );
      }
      return null;
    }
  },
  setSession: (next: {
    accessToken: string;
    refreshToken: string;
    sessionTokenId: string;
    user: User;
  }) => {
    const updated: AuthSessionSnapshot = { ...next };
    snapshot = updated;
    emit();
    persist(updated);
  },
  setTokens: (next: {
    accessToken: string;
    refreshToken: string;
    sessionTokenId: string;
  }) => {
    const updated: AuthSessionSnapshot = {
      ...snapshot,
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      sessionTokenId: next.sessionTokenId,
    };
    snapshot = updated;
    emit();
    persist(updated);
  },
  setUser: (user: User | null) => {
    if (snapshot.user === user) return;
    snapshot = { ...snapshot, user };
    emit();
    persist(snapshot);
  },
  clear: () => {
    if (
      !snapshot.accessToken &&
      !snapshot.refreshToken &&
      !snapshot.sessionTokenId &&
      !snapshot.user
    )
      return;
    snapshot = {
      accessToken: null,
      refreshToken: null,
      sessionTokenId: null,
      user: null,
    };
    emit();
    clearPersisted();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const getAccessToken = () => authSessionStore.getSnapshot().accessToken;
export const getRefreshToken = () =>
  authSessionStore.getSnapshot().refreshToken;
export const getSessionTokenId = () =>
  authSessionStore.getSnapshot().sessionTokenId;
export const getAuthUser = () => authSessionStore.getSnapshot().user;
