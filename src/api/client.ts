import axios, { type AxiosError, type AxiosInstance } from "axios";
import {
  authSessionStore,
  getAccessToken,
  getRefreshToken,
  getSessionTokenId,
} from "@features/auth/tokenStore";
import { normalizeAuthResponse } from "@features/auth/api/authResponse";

const rawBaseURL =
  typeof import.meta.env.VITE_API_URL === "string"
    ? import.meta.env.VITE_API_URL
    : undefined;

const normalizeBase = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.replace(/\/+$/, "") || undefined;
};

const normalizedBaseURL = normalizeBase(rawBaseURL);

const buildApiPath = (path: string): string => {
  const [pathname, ...rest] = path.split("?");
  const normalizedPath = `/${pathname.replace(/^\/+/, "")}`;
  const query = rest.length ? `?${rest.join("?")}` : "";
  return `${normalizedPath}${query}`;
};

export const buildApiUrl = (
  path: string,
  base: string | undefined = normalizedBaseURL,
): string => {
  const url = String(path);
  if (/^https?:\/\//i.test(url)) return url;

  const normalizedPath = buildApiPath(url);
  if (!base) return normalizedPath;

  const trimmedBase = base.replace(/\/+$/, "");
  return `${trimmedBase}${normalizedPath}`;
};

const client = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Auth uses Bearer tokens; refresh may use cookies per-request.
}) as AxiosInstance;

client.interceptors.request.use(
  (config) => {
    if (typeof config.url === "string") {
      config.url = buildApiUrl(config.url);
      config.baseURL = undefined;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const isRefreshRequest = (configUrl: unknown) =>
  typeof configUrl === "string" &&
  configUrl.includes("/api/v1/session/refresh");

let refreshPromise: Promise<ReturnType<typeof normalizeAuthResponse>> | null =
  null;

const INVALID_SESSION_CODES = new Set([
  "invalid_session",
  "session_invalidated",
  "session_expired",
]);

const extractErrorCode = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;

  const maybeCode =
    record.error_code ??
    record.errorCode ??
    record.code ??
    (record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>).code
      : undefined);

  if (typeof maybeCode !== "string" && typeof maybeCode !== "number")
    return undefined;
  const normalized = String(maybeCode).trim();
  return normalized ? normalized : undefined;
};

const isInvalidSessionError = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return INVALID_SESSION_CODES.has(code.toLowerCase());
};

let sessionInvalidated = false;
authSessionStore.subscribe(() => {
  const snapshot = authSessionStore.getSnapshot();
  if (
    snapshot.accessToken ||
    snapshot.refreshToken ||
    snapshot.sessionTokenId
  ) {
    sessionInvalidated = false;
  }
});

const dispatchUnauthorized = (status: number, code?: string) => {
  if (sessionInvalidated) return;
  sessionInvalidated = true;
  window.dispatchEvent(
    new CustomEvent("app:unauthorized", { detail: { status, code } }),
  );
};

const beginRefresh = ({ refreshToken }: { refreshToken?: string }) => {
  refreshPromise ??= (async () => {
    try {
      const refreshResponse = await client.post(
        "/api/v1/session/refresh",
        { refresh_token: refreshToken },
        { headers: { Authorization: undefined } },
      );

      return normalizeAuthResponse(refreshResponse.data);
    } catch (refreshError) {
      const refreshAxiosError = refreshError as AxiosError;
      const status = refreshAxiosError?.response?.status ?? 401;
      const code = extractErrorCode(refreshAxiosError?.response?.data);

      // Hard stop: refresh failed, so clear in-memory auth artifacts to prevent
      // repeated refresh attempts and partial-auth states.
      authSessionStore.clear();
      dispatchUnauthorized(status, code);
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    if (status === 503) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/maintenance")) {
        window.location.assign("/maintenance");
      }
    } else if (status === 401 || status === 403) {
      if (isInvalidSessionError(error)) {
        authSessionStore.clear();
        dispatchUnauthorized(status, extractErrorCode(error.response?.data));
        return Promise.reject(error);
      }

      if (isRefreshRequest(error.config?.url)) {
        return Promise.reject(error);
      }
      const originalRequest = error.config;

      const refreshToken = getRefreshToken();
      const sessionTokenId = getSessionTokenId();
      const canRefreshWithToken =
        status === 401 &&
        Boolean(refreshToken && sessionTokenId) &&
        originalRequest &&
        !(originalRequest as { __authRetry?: boolean }).__authRetry &&
        !isRefreshRequest(originalRequest.url);

      if (canRefreshWithToken) {
        try {
          const next = await beginRefresh({
            refreshToken: refreshToken ?? undefined,
          });
          authSessionStore.setSession({
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
            sessionTokenId: next.sessionTokenId,
            user: next.user,
          });
          window.dispatchEvent(
            new CustomEvent("app:auth:refreshed", { detail: next }),
          );

          (originalRequest as { __authRetry?: boolean }).__authRetry = true;
          const headers = originalRequest.headers ?? {};
          if (typeof (headers as { set?: unknown }).set === "function") {
            (
              headers as unknown as {
                set: (key: string, value: string) => void;
              }
            ).set("Authorization", `Bearer ${next.accessToken}`);
          } else {
            (headers as Record<string, unknown>).Authorization =
              `Bearer ${next.accessToken}`;
          }
          originalRequest.headers = headers;
          return client.request(originalRequest);
        } catch (refreshError) {
          if (import.meta.env.MODE !== "test") {
            console.warn(
              "[api client] Refresh token flow failed",
              refreshError,
            );
          }
          return Promise.reject(error);
        }
      }

      // Centralize unauthorized handling via AuthProvider listener.
      authSessionStore.clear();
      dispatchUnauthorized(status, extractErrorCode(error.response?.data));
    }
    return Promise.reject(error);
  },
);

export default client;
