import type { AxiosHeaders } from "axios";

type ApiRequestSummary = {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number | null;
  didSendAuthHeader: boolean;
  didSendCookie: boolean;
  requestOrigin: string | undefined;
  responseHeaders?: Record<string, string | undefined>;
  error?: { message: string; code?: string; status?: number | null };
};

type WsAttemptSummary = {
  id: string;
  timestamp: number;
  url: string;
  didIncludeTokenParam: boolean;
  closeCode?: number;
  closeReason?: string;
};

type DebugState = {
  apiRequests: ApiRequestSummary[];
  wsAttempts: WsAttemptSummary[];
};

type Listener = () => void;

const listeners = new Set<Listener>();
let state: DebugState = {
  apiRequests: [],
  wsAttempts: [],
};

let requestCounter = 0;
let wsCounter = 0;

export const isDebugAuthEnabled = (): boolean => {
  const raw = import.meta.env.VITE_DEBUG_AUTH;
  if (raw === true) return true;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

export const subscribeAuthDebug = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getAuthDebugState = (): DebugState => state;

const notify = () => {
  for (const listener of listeners) listener();
};

const pushLimited = <T>(items: T[], next: T, limit: number): T[] => {
  const updated = [...items, next];
  if (updated.length <= limit) return updated;
  return updated.slice(updated.length - limit);
};

export const redactToken = (token: string | null | undefined): string => {
  if (!token) return "";
  const trimmed = token.trim();
  if (trimmed.length <= 12) return "***";
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
};

export const redactAuthHeader = (value: string | null | undefined): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) return "***";
  const token = trimmed.slice(7).trim();
  const redacted = redactToken(token);
  return redacted ? `Bearer ${redacted}` : "Bearer ***";
};

export const getHeaderValue = (
  headers: unknown,
  key: string,
): string | undefined => {
  if (!headers || typeof headers !== "object") return undefined;
  if (headers instanceof AxiosHeaders) {
    const value = headers.get(key);
    return typeof value === "string" ? value : undefined;
  }
  const record = headers as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string") return direct;
  const lower = record[key.toLowerCase()];
  if (typeof lower === "string") return lower;
  return undefined;
};

export const listHeaderKeys = (headers: unknown): string[] => {
  if (!headers || typeof headers !== "object") return [];
  if (headers instanceof AxiosHeaders) {
    const raw = headers.toJSON();
    return Object.keys(raw);
  }
  return Object.keys(headers as Record<string, unknown>);
};

export const recordApiRequest = (summary: Omit<ApiRequestSummary, "id">) => {
  const id = `req-${requestCounter++}`;
  state = {
    ...state,
    apiRequests: pushLimited(state.apiRequests, { ...summary, id }, 5),
  };
  notify();
  return id;
};

export const updateApiRequest = (
  id: string,
  patch: Partial<ApiRequestSummary>,
) => {
  const updated = state.apiRequests.map((entry) =>
    entry.id === id ? { ...entry, ...patch } : entry,
  );
  state = { ...state, apiRequests: updated };
  notify();
};

export const recordWsAttempt = (summary: Omit<WsAttemptSummary, "id">) => {
  const id = `ws-${wsCounter++}`;
  state = {
    ...state,
    wsAttempts: pushLimited(state.wsAttempts, { ...summary, id }, 5),
  };
  notify();
  return id;
};

export const updateWsAttempt = (
  id: string,
  patch: Partial<WsAttemptSummary>,
) => {
  const updated = state.wsAttempts.map((entry) =>
    entry.id === id ? { ...entry, ...patch } : entry,
  );
  state = { ...state, wsAttempts: updated };
  notify();
};

const AUTH_STORAGE_KEYS = [
  "auth.session.v1",
  "token",
  "refreshToken",
  "sessionTokenId",
  "user",
];

export const getAuthStorageSnapshot = () => {
  const presentKeys: string[] = [];
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      if (localStorage.getItem(key)) presentKeys.push(key);
    }
  } catch {
    return { presentKeys: [], error: "localStorage_unavailable" };
  }
  return { presentKeys };
};

let didLogLoginDiagnostics = false;
export const shouldLogLoginDiagnostics = (): boolean => {
  if (didLogLoginDiagnostics) return false;
  didLogLoginDiagnostics = true;
  return true;
};
