import type { User } from "./types/user";

export type AuthSessionSnapshot = {
  user: User | null;
};

type Listener = () => void;

let snapshot: AuthSessionSnapshot = {
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
  setUser: (user: User | null) => {
    if (snapshot.user === user) return;
    snapshot = { ...snapshot, user };
    emit();
  },
  clear: () => {
    if (!snapshot.user) return;
    snapshot = { user: null };
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const getAuthUser = () => authSessionStore.getSnapshot().user;
