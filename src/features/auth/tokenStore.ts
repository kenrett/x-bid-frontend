type AuthSnapshot = {
  token: string | null;
  refreshToken: string | null;
  sessionTokenId: string | null;
};

type Listener = () => void;

let snapshot: AuthSnapshot = {
  token: null,
  refreshToken: null,
  sessionTokenId: null,
};
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
  setRefreshToken: (refreshToken: string | null) => {
    if (snapshot.refreshToken === refreshToken) return;
    snapshot = { ...snapshot, refreshToken };
    emit();
  },
  setSessionTokenId: (sessionTokenId: string | null) => {
    if (snapshot.sessionTokenId === sessionTokenId) return;
    snapshot = { ...snapshot, sessionTokenId };
    emit();
  },
  setSession: (next: Partial<AuthSnapshot>) => {
    const updated: AuthSnapshot = { ...snapshot, ...next };
    if (
      updated.token === snapshot.token &&
      updated.refreshToken === snapshot.refreshToken &&
      updated.sessionTokenId === snapshot.sessionTokenId
    )
      return;
    snapshot = updated;
    emit();
  },
  clear: () => {
    if (!snapshot.token && !snapshot.refreshToken && !snapshot.sessionTokenId)
      return;
    snapshot = { token: null, refreshToken: null, sessionTokenId: null };
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const getAuthToken = () => authTokenStore.getSnapshot().token;
export const getRefreshToken = () => authTokenStore.getSnapshot().refreshToken;
export const getSessionTokenId = () =>
  authTokenStore.getSnapshot().sessionTokenId;
