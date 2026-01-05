import { useCallback, useState } from "react";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { accountApi } from "@features/account/api/accountApi";
import { showToast } from "@services/toast";
import { normalizeApiError } from "@api/normalizeApiError";

export const AccountVerifyEmailPage = () => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = Boolean(user?.email_verified || user?.email_verified_at);

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
        className="inline-flex items-center justify-center rounded-full bg-[#ff69b4] px-8 py-3 text-lg font-bold text-[#1a0d2e] transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white disabled:cursor-not-allowed disabled:bg-gray-500"
      >
        {isSending ? "Sending..." : "Resend verification email"}
      </button>
    </Page>
  );
};
