import { useMemo, useState, useSyncExternalStore } from "react";
import client, { buildApiUrl, getApiBaseUrl } from "@api/client";
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

type DiagnosticsResult = {
  timestamp: string;
  origin: string | null;
  apiBaseUrl: string | null;
  diagnostics: unknown;
  loggedIn: unknown;
  sessionRemaining: unknown;
  error?: string;
};

export const AuthDebugPanel = () => {
  const debugEnabled = isDebugAuthEnabled();
  const { key: storefrontKey, config } = useStorefront();
  const debugState = useAuthDebugState();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(
    null,
  );
  const [diagnosticsStatus, setDiagnosticsStatus] = useState<
    "idle" | "loading" | "error" | "ready"
  >("idle");

  const apiBase = getApiBaseUrl();
  const viteApiUrl =
    typeof import.meta.env.VITE_API_URL === "string" &&
    import.meta.env.VITE_API_URL.trim()
      ? import.meta.env.VITE_API_URL.trim()
      : null;
  const csrfEndpoint = buildApiUrl("/api/v1/csrf");
  const withCredentials = Boolean(client.defaults.withCredentials);

  const storageSnapshot = getAuthStorageSnapshot();

  const runDiagnostics = async () => {
    setDiagnosticsStatus("loading");
    try {
      const [diagnosticsRes, loggedInRes, sessionRemainingRes] =
        await Promise.all([
          client.get("/api/v1/diagnostics/auth"),
          client.get("/api/v1/logged_in"),
          client.get("/api/v1/session/remaining"),
        ]);
      setDiagnostics({
        timestamp: new Date().toISOString(),
        origin: window.location?.origin ?? null,
        apiBaseUrl: apiBase ?? null,
        diagnostics: diagnosticsRes.data,
        loggedIn: loggedInRes.data,
        sessionRemaining: sessionRemainingRes.data,
      });
      setDiagnosticsStatus("ready");
    } catch (error) {
      setDiagnostics({
        timestamp: new Date().toISOString(),
        origin: window.location?.origin ?? null,
        apiBaseUrl: apiBase ?? null,
        diagnostics: null,
        loggedIn: null,
        sessionRemaining: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch diagnostics",
      });
      setDiagnosticsStatus("error");
    }
  };

  const diagnosticsSummary = useMemo(() => {
    if (!diagnostics || typeof diagnostics.diagnostics !== "object")
      return null;
    const record = diagnostics.diagnostics as Record<string, unknown>;
    const cookiePresent = record.cookie_present ?? record.cookiePresent;
    const originAllowed = record.origin_allowed ?? record.originAllowed;
    return {
      cookiePresent:
        typeof cookiePresent === "boolean" ? cookiePresent : undefined,
      originAllowed:
        typeof originAllowed === "boolean" ? originAllowed : undefined,
    };
  }, [diagnostics]);

  const diagnosticsJson = diagnostics
    ? JSON.stringify(diagnostics, null, 2)
    : "";

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
          <div>VITE_API_URL: {viteApiUrl ?? "(unset)"}</div>
          <div>api base: {apiBase ?? "(relative)"}</div>
          <div>csrf endpoint: {csrfEndpoint}</div>
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

        <div className="space-y-2 border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Auth diagnostics</div>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide hover:bg-white/20"
              onClick={() => void runDiagnostics()}
            >
              {diagnosticsStatus === "loading" ? "Running..." : "Run"}
            </button>
          </div>
          <div>origin: {diagnostics?.origin ?? "-"}</div>
          <div>api base: {diagnostics?.apiBaseUrl ?? "-"}</div>
          <div>
            cookie present:{" "}
            {diagnosticsSummary?.cookiePresent === undefined
              ? "-"
              : diagnosticsSummary.cookiePresent
                ? "yes"
                : "no"}
          </div>
          <div>
            origin allowed:{" "}
            {diagnosticsSummary?.originAllowed === undefined
              ? "-"
              : diagnosticsSummary.originAllowed
                ? "yes"
                : "no"}
          </div>
          <div>
            logged_in:{" "}
            {diagnostics ? JSON.stringify(diagnostics.loggedIn) : "-"}
          </div>
          <div>
            session remaining:{" "}
            {diagnostics ? JSON.stringify(diagnostics.sessionRemaining) : "-"}
          </div>
          {diagnostics?.error ? (
            <div className="text-red-200">error: {diagnostics.error}</div>
          ) : null}
          {diagnostics ? (
            <button
              type="button"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
              onClick={() =>
                void navigator.clipboard.writeText(diagnosticsJson)
              }
            >
              Copy diagnostics JSON
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
};
