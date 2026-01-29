import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import client from "@api/client";
import { useAuth } from "@features/auth/hooks/useAuth";
import { CheckoutSuccessResponse } from "../../types/checkout";
import { Page } from "@components/Page";
import { showToast } from "@services/toast";
import { getApiErrorDetails } from "@utils/apiError";
import { walletApi } from "@features/wallet/api/walletApi";
import {
  reportUnexpectedResponse,
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";

export const PurchaseStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "pending" | "applied" | "failed" | "timeout" | "auth" | "error"
  >("loading");
  const [message, setMessage] = useState<string | null>(null);
  const { updateUserBalance, user } = useAuth();
  const hasVerifiedRef = useRef(false);
  const pollStartRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isEmailVerified = Boolean(
    user && (user.email_verified === true || user.email_verified_at),
  );

  const POLL_INTERVAL_MS = 2_000;
  const POLL_TIMEOUT_MS = 45_000;

  const logCheckoutMetric = (
    event: string,
    payload: Record<string, unknown>,
  ) => {
    if (import.meta.env.MODE === "test") return;
    console.info("[checkout status]", { event, ...payload });
  };

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const normalizeStatus = (
    payload: CheckoutSuccessResponse,
  ): { status: "pending" | "applied" | "failed"; message?: string } => {
    const rawStatus =
      typeof payload.status === "string"
        ? payload.status.trim().toLowerCase()
        : undefined;
    const paymentStatus =
      typeof payload.payment_status === "string"
        ? payload.payment_status.trim().toLowerCase()
        : undefined;

    if (rawStatus === "pending" || rawStatus === "processing") {
      return { status: "pending", message: payload.message ?? undefined };
    }
    if (
      rawStatus === "applied" ||
      rawStatus === "success" ||
      rawStatus === "paid"
    ) {
      return { status: "applied", message: payload.message ?? undefined };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return {
        status: "failed",
        message: payload.error ?? payload.message ?? undefined,
      };
    }

    if (paymentStatus === "paid" || paymentStatus === "succeeded") {
      return { status: "applied", message: payload.message ?? undefined };
    }
    if (
      paymentStatus === "failed" ||
      paymentStatus === "canceled" ||
      paymentStatus === "unpaid"
    ) {
      return {
        status: "failed",
        message: payload.error ?? payload.message ?? undefined,
      };
    }

    return { status: "pending", message: payload.message ?? undefined };
  };

  const stableVerifyFailureMessage = (statusCode: number | undefined) => {
    if (statusCode === 401) return "Your session expired, please log in again.";
    if (statusCode === 403)
      return "We couldn't verify your purchase. Please contact support.";
    if (statusCode === 404)
      return "We couldn't find that purchase. Please contact support.";
    if (statusCode && statusCode >= 500)
      return "We couldn't verify your purchase right now. Please try again.";
    return null;
  };

  const verifyPayment = useCallback(
    async (source: "initial" | "poll" | "manual") => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        setStatus("error");
        setMessage("Could not find a payment session. Please try again.");
        return;
      }
      try {
        if (user && !isEmailVerified) {
          setStatus("error");
          if (user.email_verified === false) {
            setMessage("Verify your email to complete checkout.");
            window.dispatchEvent(
              new CustomEvent("app:email_unverified", {
                detail: { status: 403, code: "email_unverified" },
              }),
            );
          } else {
            setMessage("Checking email verification status...");
          }
          return;
        }
        const response = await client.get<CheckoutSuccessResponse>(
          `/api/v1/checkout/success`,
          {
            params: { session_id: sessionId },
          },
        );

        const payload = response.data;

        if (!payload || typeof payload !== "object") {
          throw reportUnexpectedResponse("checkoutSuccess", payload);
        }

        const normalized = normalizeStatus(payload);
        if (!pollStartRef.current) {
          pollStartRef.current = Date.now();
        }

        if (normalized.status === "pending") {
          setStatus("pending");
          setMessage(
            normalized.message ??
              "Finalizing purchase... this can take a moment.",
          );
          const elapsed = Date.now() - pollStartRef.current;
          if (elapsed >= POLL_TIMEOUT_MS) {
            setStatus("timeout");
            setMessage(
              "Still processing. Please refresh in a moment or contact support if this persists.",
            );
            logCheckoutMetric("checkout.pending.timeout", {
              session_id: sessionId,
              elapsed_ms: elapsed,
              source,
            });
            return;
          }
          clearPollTimer();
          pollTimerRef.current = window.setTimeout(() => {
            void verifyPayment("poll");
          }, POLL_INTERVAL_MS);
          return;
        }

        clearPollTimer();
        if (normalized.status === "applied") {
          const elapsed = pollStartRef.current
            ? Date.now() - pollStartRef.current
            : 0;
          setStatus("applied");
          setMessage("Purchase complete. Refreshing your balance...");
          try {
            const wallet = await walletApi.getWallet();
            updateUserBalance(wallet.creditsBalance);
            setMessage(
              `Purchase complete. New balance: ${wallet.creditsBalance} credits.`,
            );
          } catch (walletError) {
            setMessage("Purchase complete. Your balance will update shortly.");
            if (import.meta.env.MODE !== "test") {
              console.error(
                "[PurchaseStatus] Failed to refresh wallet balance",
                walletError,
              );
            }
          }
          logCheckoutMetric("checkout.applied", {
            session_id: sessionId,
            elapsed_ms: elapsed,
            source,
          });
          return;
        }

        if (normalized.status === "failed") {
          const elapsed = pollStartRef.current
            ? Date.now() - pollStartRef.current
            : 0;
          setStatus("failed");
          setMessage(
            normalized.message ??
              "There was an issue with your payment. Please contact support.",
          );
          logCheckoutMetric("checkout.failed", {
            session_id: sessionId,
            elapsed_ms: elapsed,
            source,
          });
          return;
        }
      } catch (err) {
        clearPollTimer();
        setStatus("error");
        if (err instanceof UnexpectedResponseError) {
          setMessage(UNEXPECTED_RESPONSE_MESSAGE);
        } else {
          const parsed = getApiErrorDetails(err, {
            useRawErrorMessage: false,
            fallbackMessage: "An unexpected error occurred.",
          });
          if (parsed.status === 401 || parsed.status === 403) {
            setStatus("auth");
            setMessage("Please log in to verify your purchase.");
            showToast("Please log in to verify your purchase.", "error");
            return;
          }
          const stable = stableVerifyFailureMessage(parsed.status);
          const nextMessage = stable ?? parsed.message;
          setMessage(nextMessage);
          if (
            parsed.status === 404 ||
            parsed.status === 403 ||
            (parsed.status && parsed.status >= 500)
          ) {
            showToast(nextMessage, "error");
          }
        }
      }
    },
    [isEmailVerified, updateUserBalance, user],
  );

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    sessionIdRef.current = sessionId;

    if (!sessionId) {
      setStatus("error");
      setMessage("Could not find a payment session. Please try again.");
      return;
    }

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    void verifyPayment("initial");
    return () => clearPollTimer();
  }, [searchParams, verifyPayment]);

  useEffect(() => {
    if (status === "applied") {
      const id = setTimeout(() => navigate("/auctions"), 4000);
      return () => clearTimeout(id);
    }
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Verifying payment...</p>
      </Page>
    );
  }

  if (status === "pending" || status === "timeout") {
    return (
      <Page centered>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
          <h2 className="font-serif text-3xl font-bold text-white">
            Finalizing purchase
          </h2>
          <p className="text-lg text-gray-400">
            {message ?? "Finalizing purchase... this can take a moment."}
          </p>
          {status === "timeout" ? (
            <button
              type="button"
              onClick={() => {
                pollStartRef.current = Date.now();
                clearPollTimer();
                setStatus("pending");
                setMessage("Re-checking your purchase status...");
                void verifyPayment("manual");
              }}
              className="inline-flex items-center justify-center text-base bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-6 py-2 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
            >
              Refresh status
            </button>
          ) : null}
        </div>
      </Page>
    );
  }

  if (status === "auth") {
    const redirect = encodeURIComponent(
      `${window.location.pathname}${window.location.search}`,
    );
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-4 text-red-400">
          Login required
        </h2>
        <p className="mb-6 text-lg text-gray-400" role="alert">
          {message ?? "Please log in to verify your purchase."}
        </p>
        <Link
          to={`/login?redirect=${redirect}`}
          className="inline-flex items-center justify-center text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
        >
          Go to Login
        </Link>
      </Page>
    );
  }

  return (
    <Page centered>
      <h2
        className={`font-serif text-4xl font-bold mb-4 ${status === "applied" ? "text-green-400" : "text-red-400"}`}
      >
        {status === "applied" ? "Purchase Complete" : "Payment Error"}
      </h2>
      <p
        className="mb-6 text-lg text-gray-400"
        role={status === "applied" ? "status" : "alert"}
      >
        {message ?? "Something went wrong."}
      </p>
      <Link
        to="/auctions"
        className="inline-flex items-center justify-center text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
      >
        Back to Auctions
      </Link>
    </Page>
  );
};
