import { getStorefrontKey } from "../storefront/storefront";
import { warnIfCookieDomainMismatch } from "../utils/cookieDomainWarning";

type CableRuntimeInfo = {
  computedCableUrl: string;
  apiOrigin: string | null;
  apiUrl: string | undefined;
  cableUrl: string | undefined;
};

export type CableConnectionInfo = CableRuntimeInfo & {
  connectionUrl: string;
  storefrontKey: string;
};

let didWarnFallback = false;

const toOrigin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getWindowOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin;
};

const warnFallback = (details: Record<string, unknown>) => {
  if (didWarnFallback) return;
  didWarnFallback = true;
  console.warn("[cable] Falling back to default cable URL", details);
};

export const getCableRuntimeInfo = (): CableRuntimeInfo => {
  const env = import.meta.env;
  const cableUrlRaw =
    typeof env.VITE_CABLE_URL === "string" && env.VITE_CABLE_URL.trim()
      ? env.VITE_CABLE_URL.trim()
      : undefined;
  const apiUrlRaw =
    typeof env.VITE_API_BASE_URL === "string" && env.VITE_API_BASE_URL.trim()
      ? env.VITE_API_BASE_URL.trim()
      : undefined;

  if (cableUrlRaw) {
    return {
      computedCableUrl: cableUrlRaw,
      apiOrigin: toOrigin(apiUrlRaw),
      apiUrl: apiUrlRaw,
      cableUrl: cableUrlRaw,
    };
  }

  if (apiUrlRaw) {
    try {
      warnIfCookieDomainMismatch(apiUrlRaw, "cable-url");
      const apiUrl = new URL(apiUrlRaw);
      const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      const computedCableUrl = `${protocol}//${apiUrl.host}/cable`;
      return {
        computedCableUrl,
        apiOrigin: apiUrl.origin,
        apiUrl: apiUrlRaw,
        cableUrl: undefined,
      };
    } catch (error) {
      warnFallback({
        storefront_key: getStorefrontKey(),
        window_origin: getWindowOrigin(),
        VITE_API_BASE_URL: apiUrlRaw,
        VITE_CABLE_URL: cableUrlRaw,
        error: (error as Error).message,
      });
    }
  } else {
    warnFallback({
      storefront_key: getStorefrontKey(),
      window_origin: getWindowOrigin(),
      VITE_API_BASE_URL: apiUrlRaw,
      VITE_CABLE_URL: cableUrlRaw,
      error: "VITE_API_BASE_URL missing",
    });
  }

  return {
    computedCableUrl: "/cable",
    apiOrigin: toOrigin(apiUrlRaw),
    apiUrl: apiUrlRaw,
    cableUrl: cableUrlRaw,
  };
};

const appendQueryParams = (
  baseUrl: string,
  params: Record<string, string | undefined>,
): string => {
  const [path, query = ""] = baseUrl.split("?");
  const searchParams = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    searchParams.set(key, value);
  }
  const nextQuery = searchParams.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
};

export const getCableConnectionInfo = (
  storefrontKeyOverride?: string,
): CableConnectionInfo => {
  const runtime = getCableRuntimeInfo();
  const storefrontKey = storefrontKeyOverride ?? getStorefrontKey();
  const connectionUrl = appendQueryParams(runtime.computedCableUrl, {
    storefront: storefrontKey,
  });

  return {
    ...runtime,
    connectionUrl,
    storefrontKey,
  };
};
