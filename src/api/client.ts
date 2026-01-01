import axios, { type AxiosError, type AxiosInstance } from "axios";
import { showToast } from "@services/toast";
import { authTokenStore, getAuthToken } from "@features/auth/tokenStore";
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
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const shouldAttemptCookieRefresh = () =>
  import.meta.env.VITE_AUTH_REFRESH_WITH_COOKIE === "true";

const isRefreshRequest = (configUrl: unknown) =>
  typeof configUrl === "string" &&
  configUrl.includes("/api/v1/session/refresh");

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
      const originalRequest = error.config;

      const canRefresh =
        status === 401 &&
        shouldAttemptCookieRefresh() &&
        originalRequest &&
        !(originalRequest as { __authRetry?: boolean }).__authRetry &&
        !isRefreshRequest(originalRequest.url);

      if (canRefresh) {
        try {
          const refreshResponse = await client.post(
            "/api/v1/session/refresh",
            undefined,
            {
              withCredentials: true,
              headers: { Authorization: undefined },
            },
          );
          const next = normalizeAuthResponse(refreshResponse.data);
          authTokenStore.setToken(next.token);
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
            ).set("Authorization", `Bearer ${next.token}`);
          } else {
            (headers as Record<string, unknown>).Authorization =
              `Bearer ${next.token}`;
          }
          originalRequest.headers = headers;
          return client.request(originalRequest);
        } catch (refreshError) {
          // Fall through to centralized unauthorized handling.
          console.warn("[api client] Cookie refresh failed", refreshError);
        }
      }

      // Centralize unauthorized handling via AuthProvider listener.
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status } }),
      );
      showToast("Your session expired; please sign in again.", "error");
    }
    return Promise.reject(error);
  },
);

export default client;
