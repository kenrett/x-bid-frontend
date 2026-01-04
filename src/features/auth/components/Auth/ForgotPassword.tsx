import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import client from "@api/client";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import type { FieldErrors } from "@api/normalizeApiError";
import { getApiErrorDetails } from "@utils/apiError";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const submitAttemptedRef = useRef(false);

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
    setDebugToken(null);

    if (!email.trim()) {
      setFieldErrors({ email_address: ["Email is required."] });
      emailRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await client.post<
        ApiJsonResponse<"/api/v1/password/forgot", "post"> & {
          debug_token?: unknown;
        }
      >("/api/v1/password/forgot", {
        password: { email_address: email.trim() },
      });
      const token = response.data?.debug_token;
      if (token) {
        setDebugToken(String(token));
      }
      setMessage(
        "If that account exists, we've emailed instructions to reset the password.",
      );
    } catch (err) {
      const parsed = getApiErrorDetails(err, {
        useRawErrorMessage: false,
        fallbackMessage: "We couldn't process your request. Please try again.",
      });
      // Still avoid user-enumeration; surface generic failure.
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
      setMessage(
        "If that account exists, we've emailed instructions to reset the password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,105,180,0.12),transparent_35%),radial-gradient(circle_at_75%_10%,rgba(113,76,255,0.12),transparent_30%),linear-gradient(135deg,#0d0d1a_0%,#0a0a17_50%,#0f0a1f_100%)]" />
      <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col items-center px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-20">
        <div className="max-w-xl space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">
            Reset access
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
            Forgot your password?
          </h1>
          <p className="text-base text-gray-300 sm:text-lg">
            Enter the email tied to your account. If it exists, we'll send a
            secure link to reset your password.
          </p>
        </div>

        <div className="relative mt-10 w-full max-w-lg lg:mt-0">
          <div className="absolute inset-[-1px] rounded-[28px] bg-gradient-to-br from-pink-500/60 via-purple-500/40 to-indigo-500/60 opacity-60 blur-xl" />
          <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-pink-200/80">
                Password reset
              </p>
              <h2 className="text-2xl font-bold text-white">
                Email reset link
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
                  htmlFor="forgot-email"
                  className="block text-sm font-semibold text-white"
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailRef}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                  autoComplete="email"
                  aria-invalid={
                    fieldErrors.email_address?.length ||
                    fieldErrors.email?.length
                      ? "true"
                      : "false"
                  }
                  aria-describedby={
                    fieldErrors.email_address?.length ||
                    fieldErrors.email?.length
                      ? "forgot-email-error"
                      : undefined
                  }
                />
                {fieldErrors.email_address?.length ||
                fieldErrors.email?.length ? (
                  <p
                    id="forgot-email-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {(fieldErrors.email_address ?? fieldErrors.email)![0]}
                  </p>
                ) : null}
              </div>

              {message && (
                <p
                  className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-200"
                  role="status"
                >
                  {message}
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
              {debugToken && (
                <p className="rounded-lg bg-white/10 px-3 py-2 text-xs text-gray-200 break-all">
                  Debug token: {debugToken}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-[120%] bg-white/10 transition duration-500 group-hover:translate-y-0" />
                <span className="relative">
                  {isSubmitting ? "Sending link..." : "Send reset link"}
                </span>
              </button>

              <div className="text-center text-sm font-medium text-gray-300">
                <Link
                  to="/login"
                  className="text-pink-300 underline-offset-4 transition hover:text-white hover:underline"
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
