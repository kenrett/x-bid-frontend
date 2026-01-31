import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "@api/client";
import { normalizeAuthResponse } from "@features/auth/api/authResponse";
import { useAuth } from "@features/auth/hooks/useAuth";
import { getApiErrorDetails } from "@utils/apiError";
import {
  clearTwoFactorChallenge,
  readTwoFactorChallenge,
} from "@features/auth/twoFactorStorage";

export const TwoFactorChallenge = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [challenge] = useState(() => readTwoFactorChallenge());
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"otp" | "recovery">("otp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!challenge) return;
    codeRef.current?.focus();
  }, [challenge]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!challenge) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.post("/api/v1/2fa/verify", {
        challenge_id: challenge.challengeId,
        code: code.trim(),
        mode,
      });
      login(normalizeAuthResponse(response.data));
      clearTwoFactorChallenge();
      const redirectTo = challenge.redirectTo || "/auctions";
      navigate(redirectTo);
    } catch (err) {
      const parsed = getApiErrorDetails(err, {
        useRawErrorMessage: false,
        fallbackMessage: "We couldn't verify that code. Please try again.",
      });
      if (parsed.status === 429) {
        setError("Too many attempts. Please wait and try again.");
      } else if (parsed.status === 401 || parsed.status === 403) {
        setError("Verification failed. Please try again or log in again.");
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!challenge) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-gray-200">
        <p className="text-lg font-semibold text-white">
          Two-factor challenge expired
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Please return to login and try again.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,105,180,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(160,32,240,0.12),transparent_30%),linear-gradient(135deg,#0d0d1a_0%,#0a0a17_50%,#0f0a1f_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl items-center px-6 py-14">
        <div className="w-full rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-pink-200/80">
              Two-factor required
            </p>
            <h1 className="text-2xl font-bold text-white">
              Enter your authentication code
            </h1>
            <p className="text-sm text-gray-300">
              {challenge.email
                ? `We sent a sign-in request for ${challenge.email}.`
                : "Open your authenticator app to continue."}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-sm text-red-100"
            >
              {error}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-white"
                htmlFor="otp-code"
              >
                {mode === "otp" ? "Authenticator code" : "Recovery code"}
              </label>
              <input
                id="otp-code"
                ref={codeRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                placeholder={mode === "otp" ? "123456" : "ABCD-1234"}
                autoComplete="one-time-code"
                inputMode={mode === "otp" ? "numeric" : "text"}
                required
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === "otp" ? "recovery" : "otp"));
                  setCode("");
                  setError(null);
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                {mode === "otp" ? "Use recovery code" : "Use authenticator"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-400">
            Having trouble?{" "}
            <Link to="/login" className="text-pink-200 underline">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
