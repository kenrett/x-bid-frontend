import { useEffect, useMemo, useRef, useState } from "react";
import { accountApi } from "../api/accountApi";
import { normalizeApiError, type FieldErrors } from "@api/normalizeApiError";
import { showToast } from "@services/toast";

const INPUT_CLASSES =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40";

const MIN_PASSWORD_LEN = 12;
const RESEND_COOLDOWN_SECONDS = 30;

const formatDateTime = (value: string | undefined | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const AccountSecurityPage = () => {
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [security, setSecurity] = useState<{
    emailVerified: boolean;
    emailVerifiedAt?: string | null;
  } | null>(null);
  const statusErrorRef = useRef<HTMLDivElement | null>(null);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors>(
    {},
  );
  const passwordErrorRef = useRef<HTMLDivElement | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const newPasswordRef = useRef<HTMLInputElement | null>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement | null>(null);
  const submitAttemptedRef = useRef(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number | null>(
    null,
  );

  const resendCooldownRemaining = useMemo(() => {
    if (!resendCooldownUntil) return 0;
    return Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));
  }, [resendCooldownUntil]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatusError(null);

    accountApi
      .getSecurity()
      .then((data) => {
        if (cancelled) return;
        setSecurity(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatusError(normalizeApiError(err).message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!statusError) return;
    statusErrorRef.current?.focus();
  }, [statusError]);

  useEffect(() => {
    if (!submitAttemptedRef.current) return;
    if (savingPassword) return;

    if (passwordFieldErrors.current_password?.length) {
      currentPasswordRef.current?.focus();
      return;
    }
    if (passwordFieldErrors.new_password?.length) {
      newPasswordRef.current?.focus();
      return;
    }
    if (passwordFieldErrors.confirm_new_password?.length) {
      confirmNewPasswordRef.current?.focus();
      return;
    }
    if (passwordError) {
      passwordErrorRef.current?.focus();
    }
  }, [passwordError, passwordFieldErrors, savingPassword]);

  useEffect(() => {
    if (!resendCooldownUntil) return;
    if (Date.now() >= resendCooldownUntil) return;
    const id = window.setInterval(() => {
      if (Date.now() >= resendCooldownUntil) {
        setResendCooldownUntil(null);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [resendCooldownUntil]);

  const handleChangePassword = async () => {
    submitAttemptedRef.current = true;
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordFieldErrors({});

    if (newPassword.length < MIN_PASSWORD_LEN) {
      setPasswordFieldErrors({
        new_password: [
          `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
        ],
      });
      newPasswordRef.current?.focus();
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFieldErrors({
        confirm_new_password: ["Passwords do not match."],
      });
      confirmNewPasswordRef.current?.focus();
      return;
    }

    setSavingPassword(true);
    try {
      await accountApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSuccess("Password updated.");
      showToast("Password updated.", "success");
    } catch (err) {
      const parsed = normalizeApiError(err);
      setPasswordError(parsed.message);
      setPasswordFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setResendError(null);
    setResendSuccess(null);
    if (resendCooldownRemaining > 0) return;

    setResending(true);
    try {
      await accountApi.resendEmailVerification();
      setResendSuccess("Verification email sent.");
      showToast("Verification email sent.", "success");
      setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    } catch (err) {
      setResendError(normalizeApiError(err).message);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-lg">Loading security…</p>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Security</h2>
        <p className="text-sm text-gray-300">
          Update your password and manage email verification.
        </p>
      </header>

      {statusError && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
          ref={statusErrorRef}
          tabIndex={-1}
        >
          {statusError}
        </div>
      )}

      <section
        className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
        aria-busy={savingPassword ? "true" : "false"}
      >
        <h3 className="text-lg font-semibold text-white">Change password</h3>

        {passwordError && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
            ref={passwordErrorRef}
            tabIndex={-1}
          >
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="rounded-xl border border-green-400/40 bg-green-900/30 px-4 py-3 text-green-50">
            {passwordSuccess}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="current_password"
              className="block text-sm font-semibold"
            >
              Current password
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              ref={currentPasswordRef}
              className={INPUT_CLASSES}
              autoComplete="current-password"
              aria-invalid={
                passwordFieldErrors.current_password?.length ? "true" : "false"
              }
              aria-describedby={
                passwordFieldErrors.current_password?.length
                  ? "current-password-error"
                  : undefined
              }
            />
            {passwordFieldErrors.current_password?.length ? (
              <p
                id="current-password-error"
                className="text-sm text-red-300"
                role="alert"
              >
                {passwordFieldErrors.current_password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="new_password"
              className="block text-sm font-semibold"
            >
              New password
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              ref={newPasswordRef}
              className={INPUT_CLASSES}
              autoComplete="new-password"
              aria-invalid={
                passwordFieldErrors.new_password?.length ? "true" : "false"
              }
              aria-describedby={
                passwordFieldErrors.new_password?.length
                  ? "new-password-error"
                  : undefined
              }
            />
            {passwordFieldErrors.new_password?.length ? (
              <p
                id="new-password-error"
                className="text-sm text-red-300"
                role="alert"
              >
                {passwordFieldErrors.new_password[0]}
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Use at least {MIN_PASSWORD_LEN} characters.
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="confirm_new_password"
              className="block text-sm font-semibold"
            >
              Confirm new password
            </label>
            <input
              id="confirm_new_password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              ref={confirmNewPasswordRef}
              className={INPUT_CLASSES}
              autoComplete="new-password"
              aria-invalid={
                passwordFieldErrors.confirm_new_password?.length
                  ? "true"
                  : "false"
              }
              aria-describedby={
                passwordFieldErrors.confirm_new_password?.length
                  ? "confirm-new-password-error"
                  : undefined
              }
            />
            {passwordFieldErrors.confirm_new_password?.length ? (
              <p
                id="confirm-new-password-error"
                className="text-sm text-red-300"
                role="alert"
              >
                {passwordFieldErrors.confirm_new_password[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Email verification</h3>

        <div className="grid gap-2">
          <div className="text-sm text-gray-300">
            Status:{" "}
            <span className="font-semibold text-white">
              {security?.emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Verified at: {formatDateTime(security?.emailVerifiedAt)}
          </div>
        </div>

        {resendError && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
          >
            {resendError}
          </div>
        )}
        {resendSuccess && (
          <div className="rounded-xl border border-green-400/40 bg-green-900/30 px-4 py-3 text-green-50">
            {resendSuccess}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending || resendCooldownRemaining > 0}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {resending
              ? "Sending…"
              : resendCooldownRemaining > 0
                ? `Resend available in ${resendCooldownRemaining}s`
                : "Resend verification email"}
          </button>
          {!security?.emailVerified && (
            <p className="text-sm text-gray-300">
              Verification is required for sensitive account actions.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
