import type { User } from "./types/user";

export type AuthSessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

type Listener = () => void;

let snapshot: AuthSessionSnapshot = {
  accessToken: null,
  refreshToken: null,
  user: null,
};
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener();
};

/**
 * Central auth session store used by non-React modules and AuthProvider
 * hydration. This store is intentionally in-memory only; cookies are the
 * source of truth for session persistence.
 */

export const authSessionStore = {
  getSnapshot: (): AuthSessionSnapshot => snapshot,
  setSession: (next: {
    accessToken: string | null;
    refreshToken: string | null;
    user: User;
  }) => {
    snapshot = {
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      user: next.user,
    };
    emit();
  },
  setTokens: (next: {
    accessToken: string | null;
    refreshToken: string | null;
  }) => {
    snapshot = {
      ...snapshot,
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
    };
    emit();
  },
  setAccessToken: (accessToken: string | null) => {
    if (snapshot.accessToken === accessToken) return;
    snapshot = { ...snapshot, accessToken };
    emit();
  },
  setRefreshToken: (refreshToken: string | null) => {
    if (snapshot.refreshToken === refreshToken) return;
    snapshot = { ...snapshot, refreshToken };
    emit();
  },
  setUser: (user: User | null) => {
    if (snapshot.user === user) return;
    snapshot = { ...snapshot, user };
    emit();
  },
  clear: () => {
    if (!snapshot.user && !snapshot.refreshToken && !snapshot.accessToken) {
      return;
    }
    snapshot = { accessToken: null, refreshToken: null, user: null };
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const getAccessToken = () => authSessionStore.getSnapshot().accessToken;
export const getRefreshToken = () =>
  authSessionStore.getSnapshot().refreshToken;
export const getAuthUser = () => authSessionStore.getSnapshot().user;
