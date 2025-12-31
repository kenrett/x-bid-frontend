import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../api/accountApi";
import { parseAccountApiError } from "../api/accountErrors";
import { showToast } from "@services/toast";
import type { AccountSession } from "../types/account";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const AccountSessionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const currentSession = useMemo(
    () => sessions.find((s) => s.isCurrent) ?? null,
    [sessions],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await accountApi.listSessions();
      setSessions(list);
    } catch (err) {
      setError(parseAccountApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRevoke = async (session: AccountSession) => {
    setError(null);
    if (session.isCurrent) return;
    const confirmed = window.confirm(
      `Revoke this session?\n\n${session.deviceLabel}${session.ip ? ` (${session.ip})` : ""}`,
    );
    if (!confirmed) return;

    setBusyId(session.id);
    try {
      await accountApi.revokeSession(session.id);
      showToast("Session revoked.", "success");
      await load();
    } catch (err) {
      setError(parseAccountApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setError(null);
    const confirmed = window.confirm(
      "Sign out other devices? This will revoke all sessions except your current one.",
    );
    if (!confirmed) return;

    setRevokingOthers(true);
    try {
      await accountApi.revokeOtherSessions();
      showToast("Signed out other devices.", "success");
      await load();
    } catch (err) {
      setError(parseAccountApiError(err).message);
    } finally {
      setRevokingOthers(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-lg">Loading sessions…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Sessions</h2>
        <p className="text-sm text-gray-300">
          Manage devices signed into your account.
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-300">
          Current session:{" "}
          <span className="font-semibold text-white">
            {currentSession?.deviceLabel ?? "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={revokingOthers}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          {revokingOthers ? "Signing out…" : "Sign out other devices"}
        </button>
      </div>

      <div className="grid gap-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-300">No sessions found.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">
                      {session.deviceLabel}
                    </div>
                    {session.isCurrent && (
                      <span className="rounded-full border border-green-400/40 bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-100">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {session.ip ? `IP: ${session.ip} • ` : ""}
                    Last seen: {formatDateTime(session.lastSeenAt)} • Created:{" "}
                    {formatDateTime(session.createdAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRevoke(session)}
                  disabled={session.isCurrent || busyId === session.id}
                  className="rounded-lg border border-red-400/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900/30 disabled:opacity-50"
                >
                  {busyId === session.id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
