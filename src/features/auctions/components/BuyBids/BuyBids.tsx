import { useState, useEffect, type ComponentType } from "react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Link } from "react-router-dom";
import type { BidPack } from "../../types/bidPack";
import client from "@api/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Page } from "@components/Page";
import { ErrorScreen } from "@components/ErrorScreen";
import axios from "axios";
import {
  reportUnexpectedResponse,
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";
import { Sentry } from "@sentryClient";

type EmbeddedCheckoutWithReadyProps = React.ComponentProps<
  typeof EmbeddedCheckout
> & {
  onReady?: () => void;
};

const EmbeddedCheckoutWithReady =
  EmbeddedCheckout as unknown as ComponentType<EmbeddedCheckoutWithReadyProps>;

type StripeLoader = {
  promise: Promise<import("@stripe/stripe-js").Stripe | null>;
  hasKey: boolean;
};

// Lazily build the Stripe loader so tests can set env vars before render.
const buildStripeLoader = (
  mockStripePromise?: Promise<import("@stripe/stripe-js").Stripe | null>,
): StripeLoader => {
  const rawKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const forceKeyRequired =
    (globalThis as { __forceStripeKeyRequired?: boolean })
      .__forceStripeKeyRequired === true;
  if (import.meta.env.VITE_E2E_TESTS === "true" && mockStripePromise) {
    return { promise: mockStripePromise, hasKey: true };
  }
  let keyToUse =
    typeof rawKey === "string" && rawKey.trim().length > 0
      ? rawKey.trim()
      : null;
  if (!keyToUse && import.meta.env.MODE === "test" && !forceKeyRequired) {
    // In tests, fall back to a dummy key so the UI can render unless a test explicitly
    // forces the missing-key path.
    keyToUse = "pk_test_dummy";
  }
  if (!keyToUse) {
    return { promise: Promise.resolve(null), hasKey: false };
  }
  return { promise: loadStripe(keyToUse), hasKey: true };
};

export const BuyBids = () => {
  const mockStripePromise = (
    window as unknown as {
      __mockStripePromise?: Promise<import("@stripe/stripe-js").Stripe | null>;
    }
  ).__mockStripePromise;
  const { promise: stripeLoader, hasKey: hasStripeKey } =
    buildStripeLoader(mockStripePromise);
  const { user } = useAuth();
  const [bidPacks, setBidPacks] = useState<BidPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isPurchasingPackId, setIsPurchasingPackId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);

  useEffect(() => {
    setIsCheckoutReady(false);
    if (!clientSecret) return;
    // Fallback in case Stripe never fires onReady; hide the loader after the iframe should be mounted.
    const timeoutId = window.setTimeout(() => {
      setIsCheckoutReady(true);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clientSecret]);

  useEffect(() => {
    let cancelled = false;
    const markStripeError = () => {
      if (cancelled) return;
      setStripeError("Failed to load payments. Please refresh and try again.");
      Sentry.captureMessage("Stripe publishable key missing or invalid", {
        level: "error",
        extra: { route: "buy-bids" },
      });
    };

    // Surface Stripe loader failures so the user gets feedback instead of a broken checkout.
    const stripeTimeout = window.setTimeout(() => {
      markStripeError();
    }, 3000);

    if (!hasStripeKey) {
      markStripeError();
      return () => {
        cancelled = true;
        window.clearTimeout(stripeTimeout);
      };
    }

    stripeLoader
      .then((stripe) => {
        window.clearTimeout(stripeTimeout);
        if (!stripe) markStripeError();
      })
      .catch(() => {
        window.clearTimeout(stripeTimeout);
        markStripeError();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(stripeTimeout);
    };
  }, [stripeLoader, hasStripeKey]);

  useEffect(() => {
    const fetchBidPacks = async () => {
      try {
        const response = await client.get<BidPack[]>("/api/v1/bid_packs");
        const payload = response.data as
          | BidPack[]
          | { bid_packs?: unknown }
          | { data?: unknown };
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { bid_packs?: unknown }).bid_packs)
            ? (payload as { bid_packs: unknown[] }).bid_packs
            : Array.isArray((payload as { data?: unknown }).data)
              ? (payload as { data: unknown[] }).data
              : null;
        if (!Array.isArray(list)) {
          throw reportUnexpectedResponse("bidPacks", response.data);
        }
        const normalized = list.map((pack) => {
          const typed = pack as BidPack;
          const bids = Number(typed.bids);
          const status: BidPack["status"] =
            typed.status === "retired" ? "retired" : "active";
          const active =
            typeof typed.active === "boolean"
              ? typed.active
              : status === "active";
          const price = Number(typed.price);
          const pricePerBid =
            typed.pricePerBid !== undefined && typed.pricePerBid !== null
              ? String(typed.pricePerBid)
              : bids > 0 && !Number.isNaN(price)
                ? (price / bids).toFixed(2)
                : "0.00";
          return {
            ...(typed as BidPack),
            status,
            active,
            price: Number.isNaN(price) ? 0 : price,
            bids: Number.isNaN(bids) ? 0 : bids,
            pricePerBid,
            highlight: Boolean(typed.highlight),
          };
        });
        setBidPacks(normalized);
      } catch (err) {
        if (err instanceof UnexpectedResponseError) {
          setError(UNEXPECTED_RESPONSE_MESSAGE);
        } else {
          setError("Failed to fetch bid packs.");
        }
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

  if (error || stripeError)
    return (
      <ErrorScreen
        message={error ?? stripeError ?? "Unable to load bid packs."}
      />
    );

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
        "/api/v1/checkouts",
        {
          bid_pack_id: id,
        },
      );

      const { clientSecret } = response.data ?? {};
      if (typeof clientSecret !== "string") {
        throw reportUnexpectedResponse("checkoutCreate", response.data);
      }

      setClientSecret(clientSecret);
    } catch (err) {
      if (err instanceof UnexpectedResponseError) {
        setError(UNEXPECTED_RESPONSE_MESSAGE);
      } else if (axios.isAxiosError(err)) {
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
          {!isCheckoutReady && (
            <p className="text-gray-300">Loading secure checkout...</p>
          )}
          <EmbeddedCheckoutProvider
            stripe={stripeLoader}
            options={{ clientSecret }}
          >
            <EmbeddedCheckoutWithReady
              onReady={() => setIsCheckoutReady(true)}
            />
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
