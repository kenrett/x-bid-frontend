import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

export const PurchaseStatus = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string | null>(null);
  const { updateUserBalance } = useAuth();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("Could not find a payment session. Please try again.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await client.get<{
          status: string;
          updated_bid_credits?: number;
          error?: string;
        }>(`/checkout/success`, {
          params: { session_id: sessionId },
        });
        if (response.data.status === "success" && response.data.updated_bid_credits !== undefined) {
          setStatus("success");
          setMessage("Your purchase was successful! Your new balance is updated.");
          updateUserBalance(response.data.updated_bid_credits);
        } else {
          setStatus("error");
          setMessage(
            response.data.error ||
              "There was an issue with your payment. Please contact support.",
          );
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.response?.data?.error || "Failed to verify payment status.",
        );
      }
    };

    verifyPayment();
  }, []);

  if (status === "loading") {
    return <div className="font-sans bg-[#0d0d1a] text-gray-400 text-lg text-center p-8 min-h-screen">Verifying payment...</div>;
  }

  return (
    <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4 text-center">
      <h2 className={`font-serif text-4xl font-bold mb-4 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
        {status === "success" ? "Payment Successful" : "Payment Error"}
      </h2>
      <p className="mb-6 text-lg text-gray-400">{message}</p>
      <Link
        to="/buy-bids"
        className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
      >
        Back to Bid Packs
      </Link>
    </div>
  );
};