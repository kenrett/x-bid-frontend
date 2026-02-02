import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { authSessionStore } from "@features/auth/tokenStore";
import { getStorefrontKey } from "../storefront/storefront";
import { requestAgeGateAcceptance } from "../ageGate/ageGateStore";
import {
  getHeaderValue,
  isDebugAuthEnabled,
  listHeaderKeys,
  recordApiRequest,
  redactAuthHeader,
  updateApiRequest,
} from "../debug/authDebug";
import {
  enforceLocalhostApiHostMatch,
  warnIfCookieDomainMismatch,
} from "../utils/cookieDomainWarning";

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
  typeof import.meta.env.VITE_API_BASE_URL === "string"
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;

const resolveRuntimeApiBase = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location?.hostname ?? "";
  if (!hostname) return undefined;
  if (
    hostname.endsWith("biddersweet.app") &&
    hostname !== "api.biddersweet.app"
  )
    return "https://api.biddersweet.app";
  return undefined;
};

const normalizeBase = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.toLowerCase() === "undefined") return undefined;
  if (trimmed.toLowerCase() === "null") return undefined;
  return trimmed.replace(/\/+$/, "") || undefined;
};

const normalizedBaseURL = normalizeBase(rawBaseURL) ?? resolveRuntimeApiBase();
warnIfCookieDomainMismatch(normalizedBaseURL, "api-client");
enforceLocalhostApiHostMatch(normalizedBaseURL);
export const getApiBaseUrl = () => normalizedBaseURL;

const getWindowOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin;
};

const CSRF_ENDPOINT = "/api/v1/csrf";

const getWindowHost = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.host;
};

const createRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through to a stable string generator
    }
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const getErrorReason = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (!error || typeof error !== "object") return undefined;
  const reason = (error as Record<string, unknown>).reason;
  return typeof reason === "string" ? reason : undefined;
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
}) as AxiosInstance;

type AuthDebugMeta = {
  id: string;
  didSendAuthHeader: boolean;
  didSendCookie: boolean;
  requestOrigin: string | undefined;
};

type AuthDebugRequestConfig = AxiosRequestConfig & {
  __authDebug?: AuthDebugMeta;
  __debugLogin?: boolean;
  __debugSwitchWhoami?: boolean;
  __requestId?: string;
  __skipCsrf?: boolean;
  __csrfRetry?: boolean;
};

client.interceptors.request.use(
  (config) => {
    if (!isDebugAuthEnabled()) return config;
    const headers = config.headers;
    const authHeader = getHeaderValue(headers, "Authorization");
    const requestOrigin = getWindowOrigin();
    const method = (config.method ?? "get").toUpperCase();
    const url = typeof config.url === "string" ? config.url : "-";
    const didSendAuthHeader = Boolean(authHeader);
    const didSendCookie = Boolean(config.withCredentials);
    const requestId = recordApiRequest({
      timestamp: Date.now(),
      method,
      url,
      status: null,
      didSendAuthHeader,
      didSendCookie,
      requestOrigin,
    });

    (config as AuthDebugRequestConfig).__authDebug = {
      id: requestId,
      didSendAuthHeader,
      didSendCookie,
      requestOrigin,
    };

    console.info("[api debug] request", {
      method,
      url,
      baseURL: config.baseURL,
      origin: requestOrigin,
      withCredentials: Boolean(config.withCredentials),
      authHeader: didSendAuthHeader ? redactAuthHeader(authHeader) : undefined,
    });

    if ((config as AuthDebugRequestConfig).__debugLogin) {
      const headerKeys = listHeaderKeys(headers);
      const extraHeaders = headerKeys.filter(
        (key) =>
          key.toLowerCase() !== "content-type" &&
          key.toLowerCase() !== "accept",
      );
      console.info("[api debug] login request headers", {
        header_keys: headerKeys,
        has_extra_headers: extraHeaders.length > 0,
        extra_headers: extraHeaders,
        withCredentials: Boolean(config.withCredentials),
      });
    }

    if (
      typeof config.url === "string" &&
      config.url.includes("/api/v1/logged_in")
    ) {
      console.info("[api debug] logged_in request", {
        url: config.url,
        didSendAuthHeader,
        withCredentials: Boolean(config.withCredentials),
        origin: requestOrigin,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.request.use(
  (config) => {
    if (typeof config.url === "string") {
      config.url = buildApiUrl(config.url);
      config.baseURL = undefined;
    }
    if (typeof config.url === "string") {
      const resolvedUrl = config.url;
      const originFallback = getWindowOrigin() ?? "http://localhost";
      const apiBase = normalizedBaseURL ?? getWindowOrigin();
      let shouldInclude = false;

      if (apiBase) {
        try {
          const apiUrl = new URL(apiBase, originFallback);
          const requestUrl = new URL(resolvedUrl, originFallback);
          const apiPath = apiUrl.pathname.replace(/\/+$/, "");
          const requestPath = requestUrl.pathname;
          const pathMatches =
            apiPath === "" ||
            requestPath === apiPath ||
            requestPath.startsWith(`${apiPath}/`);
          shouldInclude = requestUrl.origin === apiUrl.origin && pathMatches;
        } catch {
          shouldInclude = false;
        }
      }

      config.withCredentials = shouldInclude;
    } else {
      config.withCredentials = false;
    }
    if (isDebugAuthEnabled() || import.meta.env.DEV) {
      const method = (config.method ?? "get").toUpperCase();
      const resolvedUrlForLog =
        typeof config.url === "string" ? config.url : "-";
      const headerKeys = listHeaderKeys(config.headers);
      console.info("[api debug] resolved request", {
        method,
        url: resolvedUrlForLog,
        withCredentials: Boolean(config.withCredentials),
        headers: headerKeys,
        storefront_key: getStorefrontKey(),
        vite_api_url_set:
          typeof import.meta.env.VITE_API_BASE_URL === "string" &&
          Boolean(import.meta.env.VITE_API_BASE_URL.trim()),
      });
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

const isCsrfRequest = (configUrl: unknown) =>
  typeof configUrl === "string" && configUrl.includes(CSRF_ENDPOINT);

let csrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;

const storeCsrfToken = (value: unknown) => {
  if (typeof value !== "string") {
    csrfToken = null;
    return null;
  }
  const trimmed = value.trim();
  csrfToken = trimmed ? trimmed : null;
  return csrfToken;
};

const fetchCsrfToken = async () => {
  try {
    const response = await client.get(CSRF_ENDPOINT, {
      __skipCsrf: true,
    } as AxiosRequestConfig);
    const token = (response.data as { csrf_token?: unknown })?.csrf_token;
    if ((isDebugAuthEnabled() || import.meta.env.DEV) && !token) {
      const data = response.data as Record<string, unknown> | undefined;
      console.warn("[api debug] csrf response missing token", {
        status: response.status,
        response_keys: data ? Object.keys(data) : [],
        has_csrf_probe: Boolean(
          (response.headers as Record<string, string | undefined>)?.[
            "x-csrf-probe"
          ],
        ),
      });
    }
    return storeCsrfToken(token);
  } catch (error) {
    if (isDebugAuthEnabled() || import.meta.env.DEV) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? null;
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;
        const responseKeys = data ? Object.keys(data) : [];
        const corsBlocked = !error.response;
        const headers = (error.response?.headers ?? {}) as Record<
          string,
          string | undefined
        >;
        console.warn("[api debug] csrf fetch failed", {
          status,
          response_keys: responseKeys,
          cors_blocked: corsBlocked,
          has_csrf_probe: Boolean(headers["x-csrf-probe"]),
        });
      } else {
        console.warn("[api debug] csrf fetch failed", {
          status: null,
          response_keys: [],
          cors_blocked: true,
          has_csrf_probe: false,
        });
      }
    }
    throw error;
  }
};

const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  csrfPromise ??= fetchCsrfToken().finally(() => {
    csrfPromise = null;
  });
  return csrfPromise;
};

const refreshCsrfToken = async () => {
  csrfToken = null;
  return ensureCsrfToken();
};

const isUnsafeMethod = (method: string | undefined) => {
  const normalized = (method ?? "get").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
};

const isCsrfFailure = (error: AxiosError): boolean => {
  const code = extractErrorCode(error.response?.data);
  if (!code) return false;
  return code.toLowerCase().includes("csrf");
};

client.interceptors.request.use(
  async (config) => {
    if (
      isUnsafeMethod(config.method) &&
      !(config as AuthDebugRequestConfig).__skipCsrf &&
      !isCsrfRequest(config.url)
    ) {
      const token = await ensureCsrfToken();
      if (token) {
        setHeader(config, "X-CSRF-Token", token);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.request.use(
  (config) => {
    const existingRequestId = getHeaderValue(config.headers, "X-Request-Id");
    const requestId = existingRequestId ?? createRequestId();
    setHeader(config, "X-Request-Id", requestId);
    (config as AuthDebugRequestConfig).__requestId = requestId;

    if (import.meta.env.MODE === "development") {
      const method = (config.method ?? "get").toUpperCase();
      const url = typeof config.url === "string" ? config.url : "-";
      const storefrontKey = getStorefrontKey();
      const authHeader = getHeaderValue(config.headers, "Authorization");
      const withCredentials = Boolean(config.withCredentials);

      console.info("[auth net] request", {
        request_id: requestId,
        method,
        url,
        storefront_key: storefrontKey,
        has_auth_header: Boolean(authHeader),
        with_credentials: withCredentials,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const logInvalidToken = (
  config: AxiosRequestConfig | undefined,
  data: unknown,
) => {
  if (import.meta.env.MODE !== "development") return;
  const code = extractErrorCode(data);
  if (!code || code.toLowerCase() !== "invalid_token") return;
  const requestId =
    getHeaderValue(config?.headers, "X-Request-Id") ??
    (config as AuthDebugRequestConfig | undefined)?.__requestId;
  console.warn("[auth net] invalid_token", {
    request_id: requestId,
    reason: getErrorReason(data),
    origin: getWindowOrigin(),
    host: getWindowHost(),
  });
};

const INVALID_SESSION_CODES = new Set([
  "invalid_session",
  "session_invalidated",
  "session_expired",
  "invalid_token",
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

export const handleResponseError = async (error: AxiosError) => {
  const status = error?.response?.status;
  const originalRequest = error.config;
  logInvalidToken(originalRequest, error.response?.data);
  if (isDebugAuthEnabled()) {
    const debugMeta = (originalRequest as AuthDebugRequestConfig)?.__authDebug;
    if (debugMeta) {
      const headers = (error.response?.headers ?? {}) as Record<
        string,
        string | undefined
      >;
      updateApiRequest(debugMeta.id, {
        status: status ?? null,
        responseHeaders: {
          "access-control-allow-origin": headers["access-control-allow-origin"],
          "access-control-allow-credentials":
            headers["access-control-allow-credentials"],
          vary: headers.vary,
          "set-cookie": headers["set-cookie"],
        },
        error: {
          message: error.message,
          code: error.code,
          status: status ?? null,
        },
      });
      console.warn("[api debug] response error", {
        status,
        message: error.message,
        code: error.code,
        cors: {
          "access-control-allow-origin": headers["access-control-allow-origin"],
          "access-control-allow-credentials":
            headers["access-control-allow-credentials"],
          vary: headers.vary,
          "set-cookie": headers["set-cookie"],
        },
      });
    }
  }

  if (
    isCsrfFailure(error) &&
    originalRequest &&
    !(originalRequest as AuthDebugRequestConfig).__csrfRetry &&
    !isCsrfRequest(originalRequest.url)
  ) {
    try {
      await refreshCsrfToken();
      (originalRequest as AuthDebugRequestConfig).__csrfRetry = true;
      return client.request(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }

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

    authSessionStore.clear();
    dispatchUnauthorized(status, code);
  }

  return Promise.reject(error);
};

client.interceptors.response.use((response) => {
  logInvalidToken(response.config, response.data);
  if (isDebugAuthEnabled()) {
    const debugMeta = (response.config as AuthDebugRequestConfig).__authDebug;
    if (debugMeta) {
      const headers = (response.headers ?? {}) as Record<
        string,
        string | undefined
      >;
      updateApiRequest(debugMeta.id, {
        status: response.status,
        responseHeaders: {
          "access-control-allow-origin": headers["access-control-allow-origin"],
          "access-control-allow-credentials":
            headers["access-control-allow-credentials"],
          vary: headers.vary,
          "set-cookie": headers["set-cookie"],
        },
      });
      console.info("[api debug] response", {
        status: response.status,
        cors: {
          "access-control-allow-origin": headers["access-control-allow-origin"],
          "access-control-allow-credentials":
            headers["access-control-allow-credentials"],
          vary: headers.vary,
          "set-cookie": headers["set-cookie"],
        },
      });
    }
  }
  if (isMaintenanceHeader(response?.headers)) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/maintenance")) {
      window.location.assign("/maintenance");
    }
  }
  return response;
}, handleResponseError);

export const __testOnly = {
  clearCsrfToken: () => {
    csrfToken = null;
    csrfPromise = null;
  },
};

if (import.meta.env.DEV && typeof window !== "undefined") {
  (
    window as {
      __probeCsrf?: () => Promise<void>;
    }
  ).__probeCsrf = async () => {
    const resolvedUrlForLog = buildApiUrl(CSRF_ENDPOINT);
    try {
      const response = await client.get(CSRF_ENDPOINT, {
        __skipCsrf: true,
      } as AxiosRequestConfig);
      const token = (response.data as { csrf_token?: unknown })?.csrf_token;
      console.info("[api debug] csrf probe", {
        url: resolvedUrlForLog,
        status: response.status,
        has_csrf_token: typeof token === "string" && token.trim().length > 0,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? null;
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;
        console.warn("[api debug] csrf probe failed", {
          url: resolvedUrlForLog,
          status,
          response_keys: data ? Object.keys(data) : [],
          cors_blocked: !error.response,
        });
      } else {
        console.warn("[api debug] csrf probe failed", {
          url: resolvedUrlForLog,
          status: null,
          response_keys: [],
          cors_blocked: true,
        });
      }
    }
  };
}

export default client;
