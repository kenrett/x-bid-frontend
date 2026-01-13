import { useSyncExternalStore } from "react";
import client, { getApiBaseUrl } from "@api/client";
import { useStorefront } from "../storefront/useStorefront";
import {
  getAuthDebugState,
  getAuthStorageSnapshot,
  isDebugAuthEnabled,
  subscribeAuthDebug,
} from "./authDebug";

const formatStatus = (status: number | null) =>
  status === null || status === undefined ? "-" : String(status);

const useAuthDebugState = () =>
  useSyncExternalStore(
    subscribeAuthDebug,
    getAuthDebugState,
    getAuthDebugState,
  );

export const AuthDebugPanel = () => {
  const debugEnabled = isDebugAuthEnabled();
  const { key: storefrontKey, config } = useStorefront();
  const debugState = useAuthDebugState();

  const apiBase = getApiBaseUrl();
  const withCredentials = Boolean(client.defaults.withCredentials);

  const storageSnapshot = getAuthStorageSnapshot();

  if (!debugEnabled) return null;

  const cookieLength =
    typeof document === "undefined" ? undefined : document.cookie.length;

  return (
    <aside
      className="fixed bottom-4 left-4 z-[100] w-[320px] max-w-[90vw] rounded-xl border border-white/20 bg-black/80 text-white shadow-xl backdrop-blur"
      aria-label="Auth debug panel"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide">
        <span>Auth Debug</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
          {import.meta.env.MODE}
        </span>
      </div>
      <div className="space-y-3 px-3 py-2 text-xs">
        <div className="space-y-1">
          <div>
            origin:{" "}
            {typeof window === "undefined" ? "-" : window.location.origin}
          </div>
          <div>
            storefront: {storefrontKey} ({config.name})
          </div>
          <div>api base: {apiBase ?? "(relative)"}</div>
          <div>
            localStorage auth keys:{" "}
            {storageSnapshot.presentKeys.join(", ") || "(none)"}
          </div>
          <div>document.cookie length: {cookieLength ?? "-"}</div>
          <div>axios withCredentials: {withCredentials ? "true" : "false"}</div>
        </div>

        <div className="space-y-1">
          <div className="font-semibold">Last 5 API requests</div>
          {debugState.apiRequests.length ? (
            <ul className="space-y-1">
              {debugState.apiRequests.map((entry) => (
                <li key={entry.id} className="rounded bg-white/5 p-1">
                  <div>
                    {entry.method} {entry.url}
                  </div>
                  <div>
                    status: {formatStatus(entry.status)} | auth:{" "}
                    {entry.didSendAuthHeader ? "yes" : "no"} | cookies:{" "}
                    {entry.didSendCookie ? "include" : "omit"}
                  </div>
                  <div>origin: {entry.requestOrigin ?? "-"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-white/70">(no requests yet)</div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-semibold">Last 5 WS attempts</div>
          {debugState.wsAttempts.length ? (
            <ul className="space-y-1">
              {debugState.wsAttempts.map((entry) => (
                <li key={entry.id} className="rounded bg-white/5 p-1">
                  <div>{entry.url}</div>
                  <div>
                    token param: {entry.didIncludeTokenParam ? "yes" : "no"}
                  </div>
                  <div>
                    close: {entry.closeCode ?? "-"} {entry.closeReason ?? ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-white/70">(no ws attempts yet)</div>
          )}
        </div>
      </div>
    </aside>
  );
};
