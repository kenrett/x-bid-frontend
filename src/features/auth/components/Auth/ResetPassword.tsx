import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import client from "@api/client";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import { useAuth } from "../../hooks/useAuth";
import type { FieldErrors } from "@api/normalizeApiError";
import { getApiErrorDetails } from "@utils/apiError";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const tokenRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const submitAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // If the user was logged in, their sessions will be revoked after reset; prompt re-login.
    logout?.();
  }, [logout]);

  useEffect(() => {
    if (!submitAttemptedRef.current) return;
    if (isSubmitting) return;

    const firstInvalid =
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      null;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    if (error) {
      errorRef.current?.focus();
    }
  }, [error, fieldErrors, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    submitAttemptedRef.current = true;
    setMessage(null);
    setError(null);
    setFieldErrors({});

    if (!token.trim()) {
      setError("Please check the highlighted fields and try again.");
      setFieldErrors({
        token: ["Reset token is missing. Please use the link from your email."],
      });
      return;
    }

    if (password !== confirmPassword) {
      setError("Please check the highlighted fields and try again.");
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    try {
      setIsSubmitting(true);
      await client.post<ApiJsonResponse<"/api/v1/password/reset", "post">>(
        "/api/v1/password/reset",
        {
          password: {
            token: token.trim(),
            password,
            password_confirmation: confirmPassword,
          },
        },
      );
      setMessage("Password updated. Please sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const parsed = getApiErrorDetails(err, {
        useRawErrorMessage: false,
        fallbackMessage: "Unable to reset password. Please try again.",
      });
      if (parsed.status === 422) {
        setError("Please check the highlighted fields and try again.");
      } else {
        setError(parsed.message);
      }
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,105,180,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(160,32,240,0.12),transparent_30%),linear-gradient(135deg,#0d0d1a_0%,#0a0a17_50%,#0f0a1f_100%)]" />
      <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-purple-600/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col items-center px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-20">
        <div className="max-w-xl space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent)]">
            Reset access
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight text-[color:var(--sf-text)] drop-shadow-sm sm:text-5xl">
            Set a new password.
          </h1>
          <p className="text-base text-[color:var(--sf-mutedText)] sm:text-lg">
            Choose a new password to regain access. For your security, all
            previous sessions have been revoked.
          </p>
        </div>

        <div className="relative mt-10 w-full max-w-lg lg:mt-0">
          <div className="absolute inset-[-1px] rounded-[28px] bg-[linear-gradient(135deg,var(--sf-primary),var(--sf-accent))] opacity-60 blur-xl" />
          <div className="relative rounded-[24px] border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--sf-accent)]">
                Password reset
              </p>
              <h2 className="text-2xl font-bold text-[color:var(--sf-text)]">
                Update password
              </h2>
            </div>

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              ref={formRef}
              aria-busy={isSubmitting ? "true" : "false"}
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="reset-token"
                  className="block text-sm font-semibold text-[color:var(--sf-text)]"
                >
                  Reset token
                </label>
                <input
                  id="reset-token"
                  name="token"
                  type="text"
                  placeholder="Paste your reset token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  ref={tokenRef}
                  className="w-full rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-3 text-[color:var(--sf-text)] placeholder:text-[color:var(--sf-mutedText)] shadow-inner shadow-black/10 outline-none transition focus:border-[color:var(--sf-focus-ring)]/70 focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]/40"
                  aria-invalid={fieldErrors.token?.length ? "true" : "false"}
                  aria-describedby={
                    fieldErrors.token?.length ? "reset-token-error" : undefined
                  }
                />
                {fieldErrors.token?.length ? (
                  <p
                    id="reset-token-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {fieldErrors.token[0]}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-password"
                    className="block text-sm font-semibold text-[color:var(--sf-text)]"
                  >
                    New password
                  </label>
                  <input
                    id="reset-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ref={passwordRef}
                    className="w-full rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-3 text-[color:var(--sf-text)] placeholder:text-[color:var(--sf-mutedText)] shadow-inner shadow-black/10 outline-none transition focus:border-[color:var(--sf-focus-ring)]/70 focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]/40"
                    autoComplete="new-password"
                    aria-invalid={
                      fieldErrors.password?.length ? "true" : "false"
                    }
                    aria-describedby={
                      fieldErrors.password?.length
                        ? "reset-password-error"
                        : undefined
                    }
                  />
                  {fieldErrors.password?.length ? (
                    <p
                      id="reset-password-error"
                      className="text-sm text-red-200"
                      role="alert"
                    >
                      {fieldErrors.password[0]}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reset-password-confirm"
                    className="block text-sm font-semibold text-[color:var(--sf-text)]"
                  >
                    Confirm password
                  </label>
                  <input
                    id="reset-password-confirm"
                    name="password_confirmation"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    ref={confirmPasswordRef}
                    className="w-full rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-3 text-[color:var(--sf-text)] placeholder:text-[color:var(--sf-mutedText)] shadow-inner shadow-black/10 outline-none transition focus:border-[color:var(--sf-focus-ring)]/70 focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]/40"
                    autoComplete="new-password"
                    aria-invalid={
                      fieldErrors.password_confirmation?.length
                        ? "true"
                        : "false"
                    }
                    aria-describedby={
                      fieldErrors.password_confirmation?.length
                        ? "reset-password-confirm-error"
                        : undefined
                    }
                  />
                  {fieldErrors.password_confirmation?.length ? (
                    <p
                      id="reset-password-confirm-error"
                      className="text-sm text-red-200"
                      role="alert"
                    >
                      {fieldErrors.password_confirmation[0]}
                    </p>
                  ) : null}
                </div>
              </div>

              {message && (
                <p
                  className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-200"
                  role="status"
                >
                  {message}{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 text-[color:var(--sf-accent)] hover:text-[color:var(--sf-text)]"
                    onClick={() => navigate("/login")}
                  >
                    Sign in
                  </button>
                </p>
              )}
              {error && (
                <p
                  ref={errorRef}
                  tabIndex={-1}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(90deg,var(--sf-primary),var(--sf-accent))] px-5 py-3 text-sm font-semibold text-[color:var(--sf-onPrimary)] shadow-lg shadow-pink-500/20 transition hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)] disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-[120%] bg-white/10 transition duration-500 group-hover:translate-y-0" />
                <span className="relative">
                  {isSubmitting ? "Updating password..." : "Update password"}
                </span>
              </button>

              <div className="text-center text-sm font-medium text-[color:var(--sf-mutedText)]">
                <Link
                  to="/login"
                  className="text-[color:var(--sf-accent)] underline-offset-4 transition hover:text-[color:var(--sf-text)] hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
