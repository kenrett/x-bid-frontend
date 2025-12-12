import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import client from "@api/client";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import { useAuth } from "../../hooks/useAuth";
import { parseApiError } from "@utils/apiError";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // If the user was logged in, their sessions will be revoked after reset; prompt re-login.
    logout?.();
  }, [logout]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!token.trim()) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
      const parsed = parseApiError(err);
      setError(parsed.message || "Unable to reset password. Please try again.");
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
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">
            Reset access
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
            Set a new password.
          </h1>
          <p className="text-base text-gray-300 sm:text-lg">
            Choose a new password to regain access. For your security, all
            previous sessions have been revoked.
          </p>
        </div>

        <div className="relative mt-10 w-full max-w-lg lg:mt-0">
          <div className="absolute inset-[-1px] rounded-[28px] bg-gradient-to-br from-pink-500/60 via-purple-500/40 to-indigo-500/60 opacity-60 blur-xl" />
          <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-pink-200/80">
                Password reset
              </p>
              <h2 className="text-2xl font-bold text-white">Update password</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="reset-token"
                  className="block text-sm font-semibold text-white"
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
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-password"
                    className="block text-sm font-semibold text-white"
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
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reset-password-confirm"
                    className="block text-sm font-semibold text-white"
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
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                    autoComplete="new-password"
                  />
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
                    className="underline underline-offset-4 text-pink-200 hover:text-white"
                    onClick={() => navigate("/login")}
                  >
                    Sign in
                  </button>
                </p>
              )}
              {error && (
                <p
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-[120%] bg-white/10 transition duration-500 group-hover:translate-y-0" />
                <span className="relative">
                  {isSubmitting ? "Updating password..." : "Update password"}
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
