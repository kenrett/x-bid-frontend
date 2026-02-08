import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountApi } from "../api/accountApi";
import { normalizeApiError, type FieldErrors } from "@api/normalizeApiError";
import { showToast } from "@services/toast";
import { useAuth } from "@features/auth/hooks/useAuth";
import { TypedConfirmModal } from "@components/TypedConfirmModal";

const CONFIRM_PHRASE = "DELETE";

export const AccountDeletePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteFieldErrors, setDeleteFieldErrors] = useState<FieldErrors>({});
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const submitAttemptedRef = useRef(false);
  const deleteErrorRef = useRef<HTMLDivElement | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!currentPassword.trim()) {
      nextErrors.current_password = ["Current password is required."];
    }
    if (Object.keys(nextErrors).length === 0) return true;
    setDeleteFieldErrors(nextErrors);
    setDeleteError("Please check the highlighted fields and try again.");
    return false;
  };

  useEffect(() => {
    if (!submitAttemptedRef.current) return;
    if (deleting) return;
    if (deleteFieldErrors.current_password?.length) {
      currentPasswordRef.current?.focus();
      return;
    }
    if (deleteError) {
      deleteErrorRef.current?.focus();
    }
  }, [deleteError, deleteFieldErrors, deleting]);

  const handleOpenConfirm = () => {
    submitAttemptedRef.current = true;
    setDeleteError(null);
    setDeleteFieldErrors({});
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleteFieldErrors({});
    setDeleting(true);
    try {
      await accountApi.deleteAccount({
        current_password: currentPassword,
        confirmation: CONFIRM_PHRASE,
      });
      showToast("Account deleted.", "success");
      logout();
      navigate("/goodbye", { replace: true });
    } catch (err) {
      const parsed = normalizeApiError(err);
      setDeleteError(parsed.message);
      setDeleteFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setDeleting(false);
    }
  };

  const deleteErrorId = deleteError ? "account-delete-error" : undefined;
  const currentPasswordErrorId = deleteFieldErrors.current_password?.length
    ? "account-delete-current-password-error"
    : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[color:var(--sf-text)]">
          Delete account
        </h2>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Permanently remove your account and all associated data.
        </p>
      </header>

      <section
        className="grid gap-4 rounded-2xl border border-red-400/30 bg-red-900/10 p-5"
        aria-busy={deleting ? "true" : "false"}
      >
        <h3 className="text-lg font-semibold text-red-50">
          This action is irreversible
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-red-100/90">
          <li>You will be signed out immediately.</li>
          <li>Access to purchases, bids, and history will be removed.</li>
          <li>This cannot be undone.</li>
        </ul>

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
            className="w-full rounded-xl border border-red-400/30 bg-black/20 px-4 py-3 text-[color:var(--sf-text)] placeholder:text-[color:var(--sf-mutedText)] outline-none transition focus:ring-2 focus:ring-red-500/40"
            autoComplete="current-password"
            aria-invalid={
              deleteFieldErrors.current_password?.length ? "true" : "false"
            }
            aria-describedby={
              currentPasswordErrorId
                ? `${currentPasswordErrorId} ${deleteErrorId ?? ""}`.trim()
                : deleteErrorId
            }
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

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a]"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </section>

      <TypedConfirmModal
        open={showConfirm}
        title="Delete your account?"
        description="This will permanently delete your account and sign you out."
        phrase={CONFIRM_PHRASE}
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        danger
        onCancel={() => (deleting ? undefined : setShowConfirm(false))}
        onConfirm={() => {
          if (deleting) return;
          setShowConfirm(false);
          void handleDelete();
        }}
      />
    </div>
  );
};
