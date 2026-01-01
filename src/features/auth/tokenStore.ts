type AuthSnapshot = {
  token: string | null;
};

type Listener = () => void;

let snapshot: AuthSnapshot = { token: null };
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener();
};

/**
 * In-memory auth token cache used by non-React modules (Axios, ActionCable).
 *
 * Security note: We intentionally do not persist tokens to `localStorage`
 * because any XSS would allow account takeover. Keeping tokens in-memory limits
 * persistence across reloads.
 */
export const authTokenStore = {
  getSnapshot: (): AuthSnapshot => snapshot,
  setToken: (token: string | null) => {
    if (snapshot.token === token) return;
    snapshot = { ...snapshot, token };
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const getAuthToken = () => authTokenStore.getSnapshot().token;
