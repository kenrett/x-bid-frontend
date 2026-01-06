import { useCallback, useState } from "react";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { accountApi } from "@features/account/api/accountApi";
import { showToast } from "@services/toast";
import { normalizeApiError } from "@api/normalizeApiError";
import { Link, useSearchParams } from "react-router-dom";

export const AccountVerifyEmailPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = Boolean(user?.email_verified || user?.email_verified_at);
  const reason = searchParams.get("reason");
  const next = searchParams.get("next");
  const nextUrl = (() => {
    if (!next) return null;
    try {
      return decodeURIComponent(next);
    } catch {
      return next;
    }
  })();

  const resend = useCallback(async () => {
    setError(null);
    setIsSending(true);
    try {
      await accountApi.resendEmailVerification();
      showToast("Verification email sent. Check your inbox.", "success");
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSending(false);
    }
  }, []);

  return (
    <Page centered>
      {reason === "email_unverified" ? (
        <div
          role="alert"
          data-testid="email-unverified-banner"
          className="mb-6 w-full max-w-xl rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 py-4 text-amber-50"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className="font-semibold">Action required:</span> Verify
              your email to continue.
              {next ? (
                <span className="block text-xs text-amber-100/80">
                  You’ll be able to return to what you were doing after
                  verification.
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void resend()}
                disabled={isSending}
                className="inline-flex items-center justify-center rounded-lg border border-amber-300/30 bg-black/20 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a] disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Resend email"}
              </button>
              {next ? (
                <Link
                  to={nextUrl ?? "/"}
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a]"
                >
                  Back
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <h2 className="font-serif text-4xl font-bold mb-3 text-white">
        Verify your email
      </h2>
      <p className="mb-6 text-lg text-gray-400">
        {isVerified
          ? "Your email is verified."
          : "Verify your email to place bids and buy bid packs."}
      </p>
      {user?.email ? (
        <p className="mb-6 text-sm text-gray-300">
          Signed in as <span className="font-semibold">{user.email}</span>
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void resend()}
        disabled={isSending}
        className="inline-flex items-center justify-center rounded-full bg-[#ff69b4] px-8 py-3 text-lg font-bold text-[#1a0d2e] transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a] disabled:cursor-not-allowed disabled:bg-gray-500"
      >
        {isSending ? "Sending..." : "Resend verification email"}
      </button>
    </Page>
  );
};
