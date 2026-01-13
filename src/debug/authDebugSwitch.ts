import type { AxiosError, AxiosRequestConfig } from "axios";
import client, { getApiBaseUrl } from "@api/client";
import { getStorefrontKey } from "../storefront/storefront";
import {
  getAuthStorageSnapshot,
  isDebugAuthEnabled,
  redactToken,
} from "./authDebug";

const SWITCH_STORAGE_KEY = "debug.auth.switch.v1";

type SwitchSnapshot = {
  fromOrigin: string | undefined;
  fromStorefrontKey: string;
  toOrigin: string | undefined;
  toStorefrontKey: string | undefined;
  apiBaseUrl: string | undefined;
  storageKeys: string[];
  timestamp: number;
};

const getWindowOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin;
};

const summarizeLoggedInResponse = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return { type: typeof data };
  }
  const record = data as Record<string, unknown>;
  const loggedIn = record.logged_in;
  const hasUser = Boolean(record.user);
  const hasAccessToken =
    typeof record.access_token === "string" && record.access_token.length > 0;
  const hasRefreshToken =
    typeof record.refresh_token === "string" && record.refresh_token.length > 0;
  return {
    logged_in: loggedIn,
    has_user: hasUser,
    has_access_token: hasAccessToken,
    has_refresh_token: hasRefreshToken,
    keys: Object.keys(record).slice(0, 6),
  };
};

export const recordStorefrontSwitchIntent = (payload: {
  fromOrigin: string | undefined;
  fromStorefrontKey: string;
  toOrigin: string | undefined;
  toStorefrontKey: string | undefined;
  apiBaseUrl: string | undefined;
}) => {
  if (!isDebugAuthEnabled()) return;

  const snapshot: SwitchSnapshot = {
    ...payload,
    storageKeys: getAuthStorageSnapshot().presentKeys,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(SWITCH_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures
  }

  console.info("[auth debug] storefront switch: before", {
    from_origin: snapshot.fromOrigin,
    to_origin: snapshot.toOrigin,
    from_storefront: snapshot.fromStorefrontKey,
    to_storefront: snapshot.toStorefrontKey,
    api_base: snapshot.apiBaseUrl,
    local_storage_keys: snapshot.storageKeys,
  });
};

export const maybeLogStorefrontSwitchLanding = async () => {
  if (!isDebugAuthEnabled()) return;

  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(SWITCH_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) return;

  let snapshot: SwitchSnapshot | null = null;
  try {
    snapshot = JSON.parse(raw) as SwitchSnapshot;
  } catch {
    snapshot = null;
  }

  try {
    sessionStorage.removeItem(SWITCH_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }

  if (!snapshot) return;

  const nowOrigin = getWindowOrigin();
  const nowStorefront = getStorefrontKey();
  const storageSnapshot = getAuthStorageSnapshot();

  console.info("[auth debug] storefront switch: after", {
    from_origin: snapshot.fromOrigin,
    to_origin: nowOrigin,
    from_storefront: snapshot.fromStorefrontKey,
    to_storefront: nowStorefront,
    before_storage_keys: snapshot.storageKeys,
    after_storage_keys: storageSnapshot.presentKeys,
    before_api_base: snapshot.apiBaseUrl,
    after_api_base: getApiBaseUrl(),
  });

  try {
    const response = await client.get("/api/v1/logged_in", {
      __debugSwitchWhoami: true,
    } as AxiosRequestConfig);
    const debugMeta = (
      response.config as {
        __authDebug?: { didSendAuthHeader?: boolean };
      }
    ).__authDebug;
    console.info("[auth debug] storefront switch whoami", {
      status: response.status,
      didSendAuthHeader: Boolean(debugMeta?.didSendAuthHeader),
      body_shape: summarizeLoggedInResponse(response.data),
    });
  } catch (err) {
    const error = err as AxiosError;
    const status = error.response?.status ?? null;
    const code = error.code;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const accessToken =
      typeof data?.access_token === "string"
        ? redactToken(data.access_token)
        : undefined;
    console.warn("[auth debug] storefront switch whoami failed", {
      status,
      code,
      message: error.message,
      response_keys: data ? Object.keys(data).slice(0, 6) : undefined,
      access_token: accessToken,
    });
  }
};
