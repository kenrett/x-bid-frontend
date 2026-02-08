import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Page } from "@components/Page";
import { accountApi } from "@features/account/api/accountApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { showToast } from "@services/toast";

type VerificationState =
  | { status: "missing" }
  | { status: "loading" }
  | { status: "success"; result: "verified" | "already_verified" }
  | { status: "error"; message: string; code?: string };

const errorMessageForCode = (code?: string) => {
  switch (code) {
    case "invalid_token":
      return "This verification link is invalid or has already been used.";
    case "expired_token":
      return "This verification link has expired. Please request a new one.";
    case "bad_request":
      return "This verification link is missing required information.";
    default:
      return null;
  }
};

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>({ status: "loading" });
  const [isResending, setIsResending] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const token = useMemo(() => {
    const value = searchParams.get("token");
    return value ? value.trim() : "";
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ status: "missing" });
      return;
    }

    setState({ status: "loading" });
    accountApi
      .verifyEmail(token)
      .then((result) => {
        if (cancelled) return;
        setState({ status: "success", result: result.status });
      })
      .catch((err) => {
        if (cancelled) return;
        const normalized = normalizeApiError(err);
        const message =
          errorMessageForCode(normalized.code) ?? normalized.message;
        setState({ status: "error", message, code: normalized.code });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (state.status === "error" || state.status === "missing") {
      errorRef.current?.focus();
    }
  }, [state.status]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await accountApi.resendEmailVerification();
      showToast("Verification email sent. Check your inbox.", "success");
    } catch (err) {
      const normalized = normalizeApiError(err);
      const message =
        errorMessageForCode(normalized.code) ?? normalized.message;
      setState({ status: "error", message, code: normalized.code });
      showToast(message, "error");
    } finally {
      setIsResending(false);
    }
  };

  const heading =
    state.status === "success"
      ? state.result === "already_verified"
        ? "Email already verified"
        : "Email verified"
      : "Verify your email";

  return (
    <Page centered>
      <div className="w-full max-w-xl text-center">
        <h1 className="font-serif text-4xl font-bold text-[color:var(--sf-text)]">
          {heading}
        </h1>
        <p className="mt-3 text-base text-[color:var(--sf-mutedText)]">
          {state.status === "loading"
            ? "Verifying your email…"
            : state.status === "success"
              ? state.result === "already_verified"
                ? "This email address was already verified. You're all set."
                : "Your email has been verified successfully."
              : "We could not verify this email link."}
        </p>

        {(state.status === "error" || state.status === "missing") && (
          <div
            role="alert"
            ref={errorRef}
            tabIndex={-1}
            className="mt-6 rounded-2xl border border-red-400/40 bg-red-900/30 px-5 py-4 text-left text-sm text-red-100"
          >
            {state.status === "missing"
              ? "Verification token is missing. Please use the link from your email."
              : state.message}
          </div>
        )}

        {state.status === "loading" ? null : (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10"
            >
              Go to login
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10"
            >
              Go to account
            </Link>
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {isResending ? "Sending…" : "Resend email"}
            </button>
          </div>
        )}
      </div>
    </Page>
  );
};
