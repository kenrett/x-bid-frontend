import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import client from "@api/client";
import { normalizeAuthResponse } from "@features/auth/api/authResponse";
import { showToast } from "@services/toast";
import { getApiErrorDetails } from "@utils/apiError";
import type { FieldErrors } from "@api/normalizeApiError";
import type { ApiJsonResponse } from "@api/openapi-helpers";

const isUnexpectedAuthResponseError = (err: unknown) =>
  err instanceof Error && err.message.startsWith("Unexpected auth response:");

export const LoginForm = () => {
  const [email_address, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const submitAttemptedRef = useRef(false);
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!submitAttemptedRef.current) return;
    if (loading) return;

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
  }, [error, fieldErrors, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitAttemptedRef.current = true;
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await client.post<
        ApiJsonResponse<"/api/v1/login", "post">
      >("/api/v1/login", {
        email_address,
        password,
      });
      login(normalizeAuthResponse(response.data));
      const redirectTo = searchParams.get("redirect") || "/auctions";
      navigate(redirectTo); // Redirect on successful login
    } catch (err) {
      if (isUnexpectedAuthResponseError(err)) {
        setError("Unexpected server response. Please try again.");
        if (import.meta.env.MODE !== "production") {
          console.error(err);
        }
        return;
      }
      const parsed = getApiErrorDetails(err, {
        useRawErrorMessage: false,
        fallbackMessage: "We couldn't sign you in. Please try again.",
      });

      if (parsed.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (parsed.status === 422) {
        setError("Please check the highlighted fields and try again.");
        setFieldErrors(parsed.fieldErrors);
      } else {
        setError(parsed.message);
        if (parsed.status === 403 || (parsed.status && parsed.status >= 500)) {
          showToast(parsed.message, "error");
        }
      }

      if (import.meta.env.MODE !== "production") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,105,180,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(160,32,240,0.12),transparent_30%),linear-gradient(135deg,#0d0d1a_0%,#0a0a17_50%,#0f0a1f_100%)]" />
      <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-purple-600/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col items-center px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-20">
        <div className="max-w-xl space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300 shadow-[0_10px_50px_rgba(255,105,180,0.15)]">
            Welcome back
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
            Drop back into the bidding floor.
          </h1>
          <p className="text-base text-gray-300 sm:text-lg">
            Sign in to track live auctions, reload bids, and keep your watchlist
            in motion. The action is waiting.
          </p>
          <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2 sm:text-base">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold">
                LIVE
              </span>
              <span>Instant, live updates on every bid.</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-purple-200 text-xs font-semibold">
                SAFE
              </span>
              <span>Secure sessions with session tokens.</span>
            </div>
          </div>
        </div>

        <div className="relative mt-10 w-full max-w-lg lg:mt-0">
          <div className="absolute inset-[-1px] rounded-[28px] bg-gradient-to-br from-pink-500/60 via-purple-500/40 to-indigo-500/60 opacity-60 blur-xl" />
          <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-pink-200/80">
                  Access
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Sign in to your account
                </h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-pink-200">
                Returning bidder
              </span>
            </div>

            <form
              ref={formRef}
              className="space-y-5"
              onSubmit={handleSubmit}
              aria-busy={loading ? "true" : "false"}
            >
              <div className="space-y-2">
                <label
                  htmlFor="email_address"
                  className="block text-sm font-semibold text-white"
                >
                  Email address
                </label>
                <input
                  type="email"
                  name="email_address"
                  id="email_address"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email_address}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  aria-invalid={
                    fieldErrors.email_address?.length ||
                    fieldErrors.email?.length
                      ? "true"
                      : "false"
                  }
                  aria-describedby={
                    fieldErrors.email_address?.length ||
                    fieldErrors.email?.length
                      ? "login-email-error"
                      : undefined
                  }
                />
                {fieldErrors.email_address?.length ||
                fieldErrors.email?.length ? (
                  <p
                    id="login-email-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {(fieldErrors.email_address ?? fieldErrors.email)![0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-white"
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={
                    fieldErrors.password?.length ||
                    fieldErrors.password_confirmation?.length
                      ? "true"
                      : "false"
                  }
                  aria-describedby={
                    fieldErrors.password?.length ||
                    fieldErrors.password_confirmation?.length
                      ? "login-password-error"
                      : undefined
                  }
                />
                {fieldErrors.password?.length ||
                fieldErrors.password_confirmation?.length ? (
                  <p
                    id="login-password-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {
                      (fieldErrors.password ??
                        fieldErrors.password_confirmation)![0]
                    }
                  </p>
                ) : null}
              </div>

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
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-[120%] bg-white/10 transition duration-500 group-hover:translate-y-0" />
                <span className="relative">
                  {loading ? "Signing in..." : "Sign in"}
                </span>
              </button>

              <div className="text-center text-sm font-medium text-gray-300">
                <Link
                  to="/forgot-password"
                  className="text-pink-300 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="text-center text-sm font-medium text-gray-300">
                Not registered?{" "}
                <Link
                  to="/signup"
                  className="text-pink-300 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Create account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
