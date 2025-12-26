import axios, { type AxiosError, type AxiosInstance } from "axios";
import { showToast } from "@services/toast";

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
  withCredentials: false, // set true if using cookies for auth
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
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;
    if (status === 503) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/maintenance")) {
        window.location.assign("/maintenance");
      }
    } else if (status === 401 || status === 403) {
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
