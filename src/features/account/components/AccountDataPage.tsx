import { useEffect, useRef, useState } from "react";
import { accountApi } from "../api/accountApi";
import { normalizeApiError, type FieldErrors } from "@api/normalizeApiError";
import { showToast } from "@services/toast";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { DataExportStatus } from "../types/account";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const CONFIRM_PHRASE = "DELETE";

export const AccountDataPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<DataExportStatus | null>(
    null,
  );
  const [requestingExport, setRequestingExport] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteFieldErrors, setDeleteFieldErrors] = useState<FieldErrors>({});
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const deleteSectionRef = useRef<HTMLElement | null>(null);
  const deleteErrorRef = useRef<HTMLDivElement | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const phraseRef = useRef<HTMLInputElement | null>(null);
  const submitAttemptedRef = useRef(false);

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

  useEffect(() => {
    void load();
  }, []);

  const handleRequestExport = async () => {
    setError(null);
    setRequestingExport(true);
    try {
      const status = await accountApi.requestExport();
      setExportStatus(status);
      showToast("Export requested.", "success");
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setRequestingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    submitAttemptedRef.current = true;
    setDeleteError(null);
    setDeleteFieldErrors({});
    if (!validateDeleteForm()) return;

    const confirmed = window.confirm(
      "Delete your account? This cannot be undone and will sign you out immediately.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await accountApi.deleteAccount({
        current_password: currentPassword,
        confirmation: phrase.trim(),
      });
      showToast("Account deleted.", "success");
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      const parsed = normalizeApiError(err);
      setDeleteError(parsed.message);
      setDeleteFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!submitAttemptedRef.current) return;
    if (deleting) return;

    const firstInvalid =
      deleteSectionRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      ) ?? null;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    if (deleteError) {
      deleteErrorRef.current?.focus();
    }
  }, [deleteError, deleteFieldErrors, deleting]);

  const validateDeleteForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!currentPassword.trim()) {
      nextErrors.current_password = ["Current password is required."];
    }
    if (phrase.trim() !== CONFIRM_PHRASE) {
      nextErrors.confirmation = [`Type ${CONFIRM_PHRASE} to confirm.`];
    }
    if (Object.keys(nextErrors).length === 0) return true;
    setDeleteFieldErrors(nextErrors);
    setDeleteError("Please check the highlighted fields and try again.");
    return false;
  };

  const buildDeleteDescribedBy = (ids: Array<string | undefined>) => {
    const joined = ids.filter(Boolean).join(" ");
    return joined.length ? joined : undefined;
  };

  const deleteErrorId = deleteError ? "account-delete-error" : undefined;
  const currentPasswordErrorId = deleteFieldErrors.current_password?.length
    ? "account-delete-current-password-error"
    : undefined;
  const phraseErrorId = deleteFieldErrors.confirmation?.length
    ? "account-delete-confirmation-error"
    : undefined;

  if (loading) {
    return <p className="text-gray-400 text-lg">Loading data tools…</p>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Data</h2>
        <p className="text-sm text-gray-300">
          Export your data or permanently delete your account.
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
        <h3 className="text-lg font-semibold text-white">Data export</h3>
        <p className="text-sm text-gray-300">
          Request an export of your account data. Exports may take time to
          generate.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
          <div>
            Status:{" "}
            <span className="font-semibold text-white">
              {exportStatus?.status ?? "—"}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Requested: {formatDateTime(exportStatus?.requestedAt)} • Ready:{" "}
            {formatDateTime(exportStatus?.readyAt)}
          </div>
          {exportStatus?.downloadUrl ? (
            <div className="mt-2">
              <a
                href={exportStatus.downloadUrl}
                className="text-pink-200 underline"
                target="_blank"
                rel="noreferrer"
              >
                Download export
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRequestExport}
            disabled={requestingExport}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {requestingExport ? "Requesting…" : "Request export"}
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Refresh status
          </button>
        </div>
      </section>

      <section
        className="grid gap-4 rounded-2xl border border-red-400/30 bg-red-900/10 p-5"
        ref={deleteSectionRef}
        aria-busy={deleting ? "true" : "false"}
      >
        <h3 className="text-lg font-semibold text-red-50">Delete account</h3>
        <p className="text-sm text-red-100/90">
          This is permanent. You will lose access to bidding history, purchases,
          and any remaining bid credits.
        </p>

        {deleteError && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
            id={deleteErrorId}
            ref={deleteErrorRef}
            tabIndex={-1}
          >
            {deleteError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="delete-current-password"
              className="block text-sm font-semibold"
            >
              Current password
            </label>
            <input
              id="delete-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              ref={currentPasswordRef}
              className="w-full rounded-xl border border-red-400/30 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-red-500/40"
              autoComplete="current-password"
              aria-invalid={
                deleteFieldErrors.current_password?.length ? "true" : "false"
              }
              aria-describedby={buildDeleteDescribedBy([
                currentPasswordErrorId,
                deleteErrorId,
              ])}
            />
            {deleteFieldErrors.current_password?.length ? (
              <p
                id={currentPasswordErrorId}
                className="text-sm text-red-200"
                role="alert"
              >
                {deleteFieldErrors.current_password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="delete-phrase"
              className="block text-sm font-semibold"
            >
              Type {CONFIRM_PHRASE} to confirm
            </label>
            <input
              id="delete-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              ref={phraseRef}
              className="w-full rounded-xl border border-red-400/30 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-red-500/40"
              placeholder={CONFIRM_PHRASE}
              aria-invalid={
                deleteFieldErrors.confirmation?.length ? "true" : "false"
              }
              aria-describedby={buildDeleteDescribedBy([
                phraseErrorId,
                deleteErrorId,
              ])}
            />
            {deleteFieldErrors.confirmation?.length ? (
              <p
                id={phraseErrorId}
                className="text-sm text-red-200"
                role="alert"
              >
                {deleteFieldErrors.confirmation[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (!validateDeleteForm()) {
                currentPasswordRef.current?.focus();
                return;
              }
              void handleDeleteAccount();
            }}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
};
