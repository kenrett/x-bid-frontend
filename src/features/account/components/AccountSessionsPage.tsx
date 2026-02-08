import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountApi } from "../api/accountApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { showToast } from "@services/toast";
import { useAuth } from "@features/auth/hooks/useAuth";
import type { AccountSession } from "../types/account";
import { ConfirmModal } from "@components/ConfirmModal";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

type PendingConfirm =
  | { kind: "revoke_one"; session: AccountSession }
  | { kind: "revoke_others" }
  | { kind: "revoke_current"; session: AccountSession };

export const AccountSessionsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

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
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const revokeOne = async (session: AccountSession) => {
    setError(null);
    setBusyId(session.id);
    try {
      await accountApi.revokeSession(session.id);
      if (session.isCurrent) {
        showToast("Session ended. Please log in again.", "error");
        logout();
        navigate("/login");
        return;
      }
      showToast("Signed out of device.", "success");
      await load();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const revokeOthers = async () => {
    setError(null);
    setRevokingOthers(true);
    try {
      await accountApi.revokeOtherSessions();
      showToast("Signed out other devices.", "success");
      await load();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setRevokingOthers(false);
    }
  };

  const confirmTitle = (() => {
    if (!pendingConfirm) return "";
    if (pendingConfirm.kind === "revoke_others")
      return "Sign out other devices?";
    if (pendingConfirm.kind === "revoke_current")
      return "Sign out of this device?";
    return "Sign out of device?";
  })();

  const confirmDescription = (() => {
    if (!pendingConfirm) return undefined;
    if (pendingConfirm.kind === "revoke_others") {
      return "This will revoke all sessions except your current one.";
    }
    const { session } = pendingConfirm;
    return `${session.deviceLabel}${session.ip ? ` (${session.ip})` : ""}`;
  })();

  if (loading) {
    return (
      <p className="text-[color:var(--sf-mutedText)] text-lg">
        Loading sessions…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[color:var(--sf-text)]">
          Sessions
        </h2>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
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
        <div className="text-sm text-[color:var(--sf-mutedText)]">
          Current session:{" "}
          <span className="font-semibold text-[color:var(--sf-text)]">
            {currentSession?.deviceLabel ?? "—"}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() =>
              currentSession
                ? setPendingConfirm({
                    kind: "revoke_current",
                    session: currentSession,
                  })
                : undefined
            }
            disabled={!currentSession || busyId === currentSession?.id}
            className="rounded-lg border border-red-400/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900/30 disabled:opacity-50"
          >
            {busyId === currentSession?.id
              ? "Signing out…"
              : "Sign out of this device"}
          </button>
          <button
            type="button"
            onClick={() => setPendingConfirm({ kind: "revoke_others" })}
            disabled={revokingOthers}
            className="rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10 disabled:opacity-50"
          >
            {revokingOthers ? "Signing out…" : "Sign out of other devices"}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-[color:var(--sf-mutedText)]">
            No sessions found.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              data-testid={`session-card-${session.id}`}
              className="rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-[color:var(--sf-text)]">
                      {session.deviceLabel}
                    </div>
                    {session.isCurrent && (
                      <span className="rounded-full border border-green-400/40 bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-100">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[color:var(--sf-mutedText)]">
                    {session.ip ? `IP: ${session.ip} • ` : ""}
                    Last seen: {formatDateTime(session.lastSeenAt)} • Created:{" "}
                    {formatDateTime(session.createdAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPendingConfirm({ kind: "revoke_one", session })
                  }
                  disabled={busyId === session.id}
                  className="rounded-lg border border-red-400/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900/30 disabled:opacity-50"
                >
                  {busyId === session.id
                    ? "Signing out…"
                    : session.isCurrent
                      ? "Sign out"
                      : "Sign out"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={pendingConfirm !== null}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        danger
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          const next = pendingConfirm;
          setPendingConfirm(null);
          if (!next) return;
          if (next.kind === "revoke_others") {
            void revokeOthers();
            return;
          }
          void revokeOne(next.session);
        }}
      />
    </div>
  );
};
