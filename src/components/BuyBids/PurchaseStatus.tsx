import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import client from "@api/client";
import { useAuth } from "../../hooks/useAuth";
import { CheckoutSuccessResponse } from "@/types/checkout";
import { Page } from "../Page";

export const PurchaseStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string | null>(null);
  const { updateUserBalance } = useAuth();
  const hasVerifiedRef = useRef(false);

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
        const response = await client.get<CheckoutSuccessResponse>(
          `/checkout/success`,
          {
            params: { session_id: sessionId },
          },
        );

        if (response.data.status === "success") {
          setStatus("success");
          setMessage(
            `Your purchase was successful! New balance: ${response.data.updated_bid_credits} credits.`,
          );
          updateUserBalance(response.data.updated_bid_credits);
        } else {
          setStatus("error");
          setMessage(
            response.data.error ??
              "There was an issue with your payment. Please contact support.",
          );
        }
      } catch (err) {
        setStatus("error");
        if (axios.isAxiosError(err)) {
          setMessage(
            err.response?.data?.error || "Failed to verify payment status.",
          );
        } else {
          setMessage("An unexpected error occurred.");
        }
      }
    };

    void verifyPayment();
  }, [searchParams, updateUserBalance]);

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
      <p className="mb-6 text-lg text-gray-400">
        {message ?? "Something went wrong."}
      </p>
      <Link
        to="/auctions"
        className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
      >
        Back to Auctions
      </Link>
    </Page>
  );
};
