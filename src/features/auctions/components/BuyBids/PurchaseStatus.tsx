import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import client from "@api/client";
import { useAuth } from "@features/auth/hooks/useAuth";
import { CheckoutSuccessResponse } from "../../types/checkout";
import { Page } from "@components/Page";
import { showToast } from "@services/toast";
import { getApiErrorDetails } from "@utils/apiError";
import {
  reportUnexpectedResponse,
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";

export const PurchaseStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string | null>(null);
  const { updateUserBalance, user } = useAuth();
  const hasVerifiedRef = useRef(false);
  const isEmailVerified = Boolean(
    user && (user.email_verified === true || user.email_verified_at),
  );

  const stableVerifyFailureMessage = (statusCode: number | undefined) => {
    if (statusCode === 401) return "Your session expired, please log in again.";
    if (statusCode === 403)
      return "We couldn't verify your purchase. Please contact support.";
    if (statusCode && statusCode >= 500)
      return "We couldn't verify your purchase right now. Please try again.";
    return null;
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("Could not find a payment session. Please try again.");
      return;
    }

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyPayment = async () => {
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

        if (payload.status === "success") {
          if (typeof payload.updated_bid_credits !== "number") {
            throw reportUnexpectedResponse(
              "checkoutSuccess.updated_bid_credits",
              payload,
            );
          }
          setStatus("success");
          setMessage(
            `Your purchase was successful! New balance: ${payload.updated_bid_credits} credits.`,
          );
          updateUserBalance(payload.updated_bid_credits);
        } else if (payload.status === "error") {
          setStatus("error");
          setMessage(
            payload.error ??
              "There was an issue with your payment. Please contact support.",
          );
        } else {
          throw reportUnexpectedResponse("checkoutSuccess.status", payload);
        }
      } catch (err) {
        setStatus("error");
        if (err instanceof UnexpectedResponseError) {
          setMessage(UNEXPECTED_RESPONSE_MESSAGE);
        } else {
          const parsed = getApiErrorDetails(err, {
            useRawErrorMessage: false,
            fallbackMessage: "An unexpected error occurred.",
          });
          const stable = stableVerifyFailureMessage(parsed.status);
          const nextMessage = stable ?? parsed.message;
          setMessage(nextMessage);
          if (
            parsed.status === 401 ||
            parsed.status === 403 ||
            (parsed.status && parsed.status >= 500)
          ) {
            showToast(nextMessage, "error");
          }
        }
      }
    };

    void verifyPayment();
  }, [searchParams, updateUserBalance, user, isEmailVerified]);

  useEffect(() => {
    if (status === "success") {
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

  return (
    <Page centered>
      <h2
        className={`font-serif text-4xl font-bold mb-4 ${status === "success" ? "text-green-400" : "text-red-400"}`}
      >
        {status === "success" ? "Payment Successful" : "Payment Error"}
      </h2>
      <p
        className="mb-6 text-lg text-gray-400"
        role={status === "success" ? "status" : "alert"}
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
