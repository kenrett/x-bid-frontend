import { useEffect, useRef, useState } from "react";
import { accountApi } from "../api/accountApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { showToast } from "@services/toast";
import type { DataExportStatus } from "../types/account";

const EXPORT_POLL_INTERVAL_MS = 2000;
const EXPORT_POLL_TIMEOUT_MS = 60_000;

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const AccountExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<DataExportStatus | null>(
    null,
  );
  const [requesting, setRequesting] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const pollDeadlineRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    pollDeadlineRef.current = null;
    setPolling(false);
  };

  const download = (url: string) => {
    const existing = document.getElementById("account-export-download");
    existing?.remove();

    const anchor = document.createElement("a");
    anchor.id = "account-export-download";
    anchor.href = url;
    anchor.download = "account-data.json";
    anchor.rel = "noreferrer";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await accountApi.getExportStatus();
      setExportStatus(status);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const pollUntilReady = async () => {
    if (pollDeadlineRef.current === null) {
      pollDeadlineRef.current = Date.now() + EXPORT_POLL_TIMEOUT_MS;
    }
    try {
      const status = await accountApi.getExportStatus();
      setExportStatus(status);
      if (status.status === "ready" && status.downloadUrl) {
        stopPolling();
        showToast("Download ready.", "success");
        download(status.downloadUrl);
        return;
      }
      if (status.status === "failed") {
        stopPolling();
        setError("Export failed. Please try again.");
        return;
      }
      if (pollDeadlineRef.current && Date.now() >= pollDeadlineRef.current) {
        stopPolling();
        setError(
          "Export is taking longer than expected. Please refresh later.",
        );
        return;
      }
    } catch (err) {
      stopPolling();
      setError(normalizeApiError(err).message);
      return;
    }

    pollTimerRef.current = window.setTimeout(() => {
      void pollUntilReady();
    }, EXPORT_POLL_INTERVAL_MS);
  };

  useEffect(() => {
    void load();
    return () => stopPolling();
     
  }, []);

  const handleRequestAndDownload = async () => {
    setError(null);
    setRequesting(true);
    stopPolling();
    try {
      const status = await accountApi.requestExport();
      setExportStatus(status);
      if (status.status === "ready" && status.downloadUrl) {
        showToast("Download starting…", "success");
        download(status.downloadUrl);
        return;
      }
      showToast("Export requested. Preparing download…", "success");
      setPolling(true);
      pollDeadlineRef.current = Date.now() + EXPORT_POLL_TIMEOUT_MS;
      await pollUntilReady();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-lg">Loading export status…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Export your data</h2>
        <p className="text-sm text-gray-300">
          Download a copy of your account data as JSON. Exports may take a few
          moments to generate.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Current status</h3>

        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
          <div>
            Status:{" "}
            <span className="font-semibold text-white">
              {exportStatus?.status ?? "—"}
            </span>
            {polling ? (
              <span className="ml-2 text-xs text-gray-400">(checking…)</span>
            ) : null}
          </div>
          <div className="text-xs text-gray-400">
            Requested: {formatDateTime(exportStatus?.requestedAt)} • Ready:{" "}
            {formatDateTime(exportStatus?.readyAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRequestAndDownload}
            disabled={requesting || polling}
            className="rounded-lg bg-[#ff69b4] px-4 py-2 text-sm font-semibold text-[#1a0d2e] hover:bg-[#a020f0] hover:text-white disabled:opacity-50"
          >
            {requesting
              ? "Requesting…"
              : polling
                ? "Preparing…"
                : "Export data"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={requesting || polling}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            Refresh status
          </button>
          {exportStatus?.status === "ready" && exportStatus.downloadUrl ? (
            <button
              type="button"
              onClick={() => download(exportStatus.downloadUrl!)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Download JSON
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
};
