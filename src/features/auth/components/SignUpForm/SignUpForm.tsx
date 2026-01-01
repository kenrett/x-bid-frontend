import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "@api/client";
import { useAuth } from "@features/auth/hooks/useAuth";
import { normalizeApiError, type FieldErrors } from "@api/normalizeApiError";
import { normalizeAuthResponse } from "@features/auth/api/authResponse";

const isUnexpectedAuthResponseError = (err: unknown) =>
  err instanceof Error && err.message.startsWith("Unexpected auth response:");

export const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email_address, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const submitAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    setError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirm_password: ["Passwords do not match."] });
      return;
    }

    setLoading(true);

    try {
      const response = await client.post("/api/v1/signup", {
        name,
        email_address,
        password,
      });
      login(normalizeAuthResponse(response.data));
      navigate("/auctions");
    } catch (err) {
      if (isUnexpectedAuthResponseError(err)) {
        setError("Unexpected server response. Please try again.");
        if (import.meta.env.MODE !== "production") {
          console.error(err);
        }
        return;
      }
      const parsed = normalizeApiError(err);
      setError(parsed.message || "Failed to create account. Please try again.");
      setFieldErrors(parsed.fieldErrors ?? {});
      if (import.meta.env.MODE !== "production") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(255,105,180,0.15),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(113,76,255,0.12),transparent_30%),linear-gradient(135deg,#0d0d1a_0%,#0a0a17_50%,#0f0a1f_100%)]" />
      <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-pink-500/25 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col items-center px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-20">
        <div className="max-w-xl space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300 shadow-[0_10px_50px_rgba(255,105,180,0.15)]">
            New here
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
            Create your bidder identity.
          </h1>
          <p className="text-base text-gray-300 sm:text-lg">
            Join the marketplace, set your alerts, and jump into live auctions
            with bid packs and watchlists tailored to you.
          </p>
          <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2 sm:text-base">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold">
                AIM
              </span>
              <span>Track the drops you care about most.</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-purple-200 text-xs font-semibold">
                BOOST
              </span>
              <span>Start with bonus-ready bid packs.</span>
            </div>
          </div>
        </div>

        <div className="relative mt-10 w-full max-w-lg lg:mt-0">
          <div className="absolute inset-[-1px] rounded-[28px] bg-gradient-to-br from-pink-500/60 via-purple-500/40 to-indigo-500/60 opacity-60 blur-xl" />
          <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-pink-200/80">
                  Create
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Create an account
                </h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-pink-200">
                New bidder
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
                  htmlFor="name"
                  className="block text-sm font-semibold text-white"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Taylor Bidwell"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                  autoComplete="name"
                  aria-invalid={fieldErrors.name?.length ? "true" : "false"}
                  aria-describedby={
                    fieldErrors.name?.length ? "signup-name-error" : undefined
                  }
                />
                {fieldErrors.name?.length ? (
                  <p
                    id="signup-name-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {fieldErrors.name[0]}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email_address"
                  className="block text-sm font-semibold text-white"
                >
                  Email address
                </label>
                <input
                  id="email_address"
                  name="email_address"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email_address}
                  onChange={(e) => setEmailAddress(e.target.value)}
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
                      ? "signup-email-error"
                      : undefined
                  }
                />
                {fieldErrors.email_address?.length ||
                fieldErrors.email?.length ? (
                  <p
                    id="signup-email-error"
                    className="text-sm text-red-200"
                    role="alert"
                  >
                    {(fieldErrors.email_address ?? fieldErrors.email)![0]}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-white"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                    autoComplete="new-password"
                    aria-invalid={
                      fieldErrors.password?.length ? "true" : "false"
                    }
                    aria-describedby={
                      fieldErrors.password?.length
                        ? "signup-password-error"
                        : undefined
                    }
                  />
                  {fieldErrors.password?.length ? (
                    <p
                      id="signup-password-error"
                      className="text-sm text-red-200"
                      role="alert"
                    >
                      {fieldErrors.password[0]}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-semibold text-white"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                    autoComplete="new-password"
                    aria-invalid={
                      fieldErrors.confirm_password?.length ||
                      fieldErrors.password_confirmation?.length
                        ? "true"
                        : "false"
                    }
                    aria-describedby={
                      fieldErrors.confirm_password?.length ||
                      fieldErrors.password_confirmation?.length
                        ? "signup-confirm-password-error"
                        : undefined
                    }
                  />
                  {fieldErrors.confirm_password?.length ||
                  fieldErrors.password_confirmation?.length ? (
                    <p
                      id="signup-confirm-password-error"
                      className="text-sm text-red-200"
                      role="alert"
                    >
                      {
                        (fieldErrors.confirm_password ??
                          fieldErrors.password_confirmation)![0]
                      }
                    </p>
                  ) : null}
                </div>
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
                  {loading ? "Creating account..." : "Create account"}
                </span>
              </button>

              <div className="text-center text-sm font-medium text-gray-300">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-pink-300 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
