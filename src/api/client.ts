import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import {
  authSessionStore,
  getAccessToken,
  getRefreshToken,
} from "@features/auth/tokenStore";
import { normalizeAuthResponse } from "@features/auth/api/authResponse";
import { getStorefrontKey } from "../storefront/storefront";
import { requestAgeGateAcceptance } from "../ageGate/ageGateStore";

const setHeader = (
  config: { headers?: unknown },
  key: string,
  value: string | undefined,
) => {
  const headers = config.headers;
  if (headers instanceof AxiosHeaders) {
    if (value === undefined) headers.delete(key);
    else headers.set(key, value);
    return;
  }

  if (!headers || typeof headers !== "object") {
    (config as { headers: Record<string, unknown> }).headers = {};
  }

  (config.headers as Record<string, unknown>)[key] = value;
};

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

const getWindowOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin;
};

const isApiRequestUrl = (configUrl: unknown): boolean => {
  if (typeof configUrl !== "string") return false;
  if (!/^https?:\/\//i.test(configUrl)) {
    return configUrl.startsWith("/api/");
  }

  try {
    const origin = getWindowOrigin();
    const requestUrl = new URL(configUrl, origin ?? "http://localhost");
    if (normalizedBaseURL) {
      const apiUrl = new URL(normalizedBaseURL, origin ?? "http://localhost");
      if (requestUrl.origin !== apiUrl.origin) return false;
    } else if (origin && requestUrl.origin !== origin) {
      return false;
    }
    return requestUrl.pathname.startsWith("/api/");
  } catch {
    return false;
  }
};

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
  withCredentials: true,
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
    setHeader(config, "X-Storefront-Key", getStorefrontKey());
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken && isApiRequestUrl(config.url)) {
      setHeader(config, "Authorization", `Bearer ${accessToken}`);
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

const EMAIL_UNVERIFIED_CODES = new Set(["email_unverified"]);
const MAINTENANCE_CODES = new Set(["maintenance_mode"]);
const AGE_GATE_CODES = new Set(["age_gate_required"]);

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

const isMaintenanceHeader = (headers: unknown): boolean => {
  if (!headers || typeof headers !== "object") return false;
  const record = headers as Record<string, unknown>;
  const value =
    record["x-maintenance"] ??
    record["X-Maintenance"] ??
    record["x-maintenance-mode"] ??
    record["X-Maintenance-Mode"];
  if (typeof value !== "string" && typeof value !== "number") return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
};

const isMaintenanceError = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return MAINTENANCE_CODES.has(code.toLowerCase());
};

const isInvalidSessionError = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return INVALID_SESSION_CODES.has(code.toLowerCase());
};

const isEmailUnverifiedError = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return EMAIL_UNVERIFIED_CODES.has(code.toLowerCase());
};

const isAgeGateRequiredError = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return AGE_GATE_CODES.has(code.toLowerCase());
};

const isAgeGateAcceptRequest = (configUrl: unknown) =>
  typeof configUrl === "string" &&
  configUrl.includes("/api/v1/age_gate/accept");

let sessionInvalidated = false;
authSessionStore.subscribe(() => {
  const snapshot = authSessionStore.getSnapshot();
  if (snapshot.user) {
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

const dispatchForbidden = (status: number, code?: string) => {
  window.dispatchEvent(
    new CustomEvent("app:forbidden", { detail: { status, code } }),
  );
};

const dispatchEmailUnverified = (status: number, code?: string) => {
  window.dispatchEvent(
    new CustomEvent("app:email_unverified", { detail: { status, code } }),
  );
};

const beginRefresh = ({ refreshToken }: { refreshToken: string }) => {
  refreshPromise ??= (async () => {
    try {
      const refreshResponse = await client.post(
        "/api/v1/session/refresh",
        { refresh_token: refreshToken },
        { headers: { Authorization: undefined } },
      );
      const normalized = normalizeAuthResponse(refreshResponse.data);
      authSessionStore.setSession({
        user: normalized.user,
        accessToken: normalized.accessToken ?? null,
        refreshToken: normalized.refreshToken ?? null,
      });
      window.dispatchEvent(
        new CustomEvent("app:auth:refreshed", { detail: normalized }),
      );
      return normalized;
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

export const handleResponseError = async (error: AxiosError) => {
  const status = error?.response?.status;
  const originalRequest = error.config;

  if (
    isAgeGateRequiredError(error) &&
    originalRequest &&
    !(originalRequest as { __ageGateRetry?: boolean }).__ageGateRetry &&
    !(originalRequest as { __skipAgeGate?: boolean }).__skipAgeGate &&
    !isAgeGateAcceptRequest(originalRequest.url)
  ) {
    try {
      await requestAgeGateAcceptance();
      await client.post("/api/v1/age_gate/accept", {}, {
        __skipAgeGate: true,
      } as unknown as AxiosRequestConfig);

      (originalRequest as { __ageGateRetry?: boolean }).__ageGateRetry = true;
      return client.request(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }

  if (
    status === 503 ||
    isMaintenanceHeader(error.response?.headers) ||
    isMaintenanceError(error)
  ) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/maintenance")) {
      window.location.assign("/maintenance");
    }
    return Promise.reject(error);
  }

  if (status === 401 || status === 403) {
    const code = extractErrorCode(error.response?.data);
    if (status === 403 && isEmailUnverifiedError(error)) {
      dispatchEmailUnverified(status, code);
      return Promise.reject(error);
    }

    if (isInvalidSessionError(error)) {
      authSessionStore.clear();
      dispatchUnauthorized(status, code);
      return Promise.reject(error);
    }

    if (status === 403) {
      dispatchForbidden(status, code);
      return Promise.reject(error);
    }

    if (isRefreshRequest(error.config?.url)) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    const canRefreshWithToken =
      status === 401 &&
      Boolean(refreshToken) &&
      originalRequest &&
      !(originalRequest as { __authRetry?: boolean }).__authRetry &&
      !isRefreshRequest(originalRequest.url);

    if (canRefreshWithToken) {
      try {
        await beginRefresh({ refreshToken: refreshToken as string });
        (originalRequest as { __authRetry?: boolean }).__authRetry = true;
        return client.request(originalRequest);
      } catch (refreshError) {
        if (import.meta.env.MODE !== "test") {
          console.warn("[api client] Refresh token flow failed", refreshError);
        }
        return Promise.reject(error);
      }
    }

    authSessionStore.clear();
    dispatchUnauthorized(status, code);
  }

  return Promise.reject(error);
};

client.interceptors.response.use((response) => {
  if (isMaintenanceHeader(response?.headers)) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/maintenance")) {
      window.location.assign("/maintenance");
    }
  }
  return response;
}, handleResponseError);

export default client;
