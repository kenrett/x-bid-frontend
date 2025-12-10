import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import type { BidPack } from "../../types/bidPack";
import client from "@api/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Page } from "../Page";
import { ErrorScreen } from "../ErrorScreen";
import axios from "axios";

// Initialize Stripe outside of the component render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const BuyBids = () => {
  const { user } = useAuth();
  const [bidPacks, setBidPacks] = useState<BidPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isPurchasingPackId, setIsPurchasingPackId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const fetchBidPacks = async () => {
      try {
        const response = await client.get<BidPack[]>("/bid_packs");
        const normalized = response.data.map((pack) => {
          const bids = Number(pack.bids);
          const status: BidPack["status"] =
            pack.status === "retired" ? "retired" : "active";
          const active =
            typeof pack.active === "boolean"
              ? pack.active
              : status === "active";
          const price = Number(pack.price);
          const pricePerBid =
            pack.pricePerBid !== undefined && pack.pricePerBid !== null
              ? String(pack.pricePerBid)
              : bids > 0 && !Number.isNaN(price)
                ? (price / bids).toFixed(2)
                : "0.00";
          return {
            ...pack,
            status,
            active,
            price: Number.isNaN(price) ? 0 : price,
            bids: Number.isNaN(bids) ? 0 : bids,
            pricePerBid,
            highlight: Boolean(pack.highlight),
          };
        });
        setBidPacks(normalized);
      } catch (err) {
        setError("Failed to fetch bid packs.");
        console.error(err);
      } finally {
        setIsLoadingPacks(false);
      }
    };

    if (user) {
      void fetchBidPacks();
    } else {
      setIsLoadingPacks(false);
    }
  }, [user]);

  if (!user) {
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-4 text-white">
          Your Arsenal Awaits
        </h2>
        <p className="mb-6 text-lg text-gray-400">
          Log in to arm yourself for the auction floor.
        </p>
        <Link
          to="/login"
          className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
        >
          Log In to Continue
        </Link>
      </Page>
    );
  }

  if (isLoadingPacks) {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading bid packs...</p>
      </Page>
    );
  }

  if (error) return <ErrorScreen message={error} />;

  const handleBuy = async (id: number) => {
    const selectedPack = bidPacks.find((pack) => pack.id === id);
    if (
      selectedPack &&
      (selectedPack.status === "retired" || !selectedPack.active)
    ) {
      setError("This bid pack is retired and cannot be purchased.");
      return;
    }

    // Prevent multiple clicks while a request is in flight
    if (isPurchasingPackId !== null) return;

    if (!user) {
      setError("You must be logged in to purchase a pack.");
      return;
    }

    setIsPurchasingPackId(id);
    setError(null);

    try {
      const response = await client.post<{ clientSecret: string }>(
        `/checkouts`,
        {
          bid_pack_id: id,
        },
      );

      setClientSecret(response.data.clientSecret);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.error || "Something went wrong during purchase.";
        setError(message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsPurchasingPackId(null);
    }
  };

  if (clientSecret) {
    return (
      <Page>
        <div
          id="checkout"
          className="min-h-[320px] flex items-center justify-center bg-[#1a0d2e]/40 rounded-2xl border border-white/10 p-6"
          aria-busy="true"
        >
          <p className="text-gray-300">Loading secure checkout...</p>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="container mx-auto">
        <div className="text-center mb-12 ">
          <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
            Arm Yourself
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            More bids mean more power. Choose your pack and dominate the floor.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10"
          aria-busy={isPurchasingPackId !== null}
        >
          {bidPacks
            .filter((pack) => pack.status === "active" && pack.active)
            .map((pack, index) => (
              <div
                key={pack.id}
                className={`group flex flex-col text-center bg-[#1a0d2e]/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  pack.highlight
                    ? "border-pink-500 hover:shadow-pink-500/20 relative"
                    : "border-white/10 hover:shadow-purple-500/20"
                }`}
                style={{
                  animation: `fadeInUp 0.5s ${index * 0.1}s ease-out both`,
                }}
              >
                {pack.highlight && (
                  <div className="absolute -top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-6">
                    BEST VALUE
                  </div>
                )}
                <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
                  {pack.name}
                </h2>
                <p className="text-sm text-gray-400 mb-4 h-10">
                  {pack.description}
                </p>
                <div className="my-4">
                  <span className="text-6xl font-extrabold text-white">
                    {pack.bids}
                  </span>
                  <span className="text-xl font-medium text-gray-400">
                    {" "}
                    Bids
                  </span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${Number(pack.price).toFixed(2)}
                </div>
                <p className="text-pink-400 mb-6 font-medium">
                  ({pack.pricePerBid}/Bid)
                </p>
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={isPurchasingPackId !== null}
                  aria-busy={isPurchasingPackId === pack.id}
                  className={`mt-auto w-full font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    pack.highlight
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white transform hover:scale-105"
                      : "bg-white/10 text-white hover:bg-white/20 transform hover:-translate-y-0.5"
                  }`}
                >
                  {isPurchasingPackId === pack.id
                    ? "Processing..."
                    : "Acquire Pack"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </Page>
  );
};
