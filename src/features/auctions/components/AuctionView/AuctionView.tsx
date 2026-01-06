import { memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import { Countdown } from "../Countdown/Countdown";
const BidHistory = lazy(() =>
  import("../BidHistory/BidHistory").then((module) => ({
    default: module.BidHistory,
  })),
);

import type { AuctionDetail } from "../../types/auction";
import type { Bid } from "../../types/bid";
import type { AuctionConnectionState } from "@features/auctions/hooks/useAuctionChannel";
import type { User as AuthUser } from "@features/auth/types/user";

interface AuctionViewProps {
  auction: AuctionDetail;
  user: AuthUser | null;
  isBidding: boolean;
  bidError: string | null;
  highestBidderUsername: string | null;
  connectionState: AuctionConnectionState;
  onPlaceBid: () => void;
  onTimerEnd: () => void;
  bids: Bid[];
}

const AuctionViewComponent = ({
  auction,
  user,
  isBidding,
  bidError,
  highestBidderUsername,
  connectionState,
  onPlaceBid,
  onTimerEnd,
  bids,
}: AuctionViewProps) => {
  const navigate = useNavigate();
  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const isEmailVerified =
    user?.email_verified === true || Boolean(user?.email_verified_at);
  const isEmailVerificationUnknown = Boolean(
    user && user.email_verified === null && !user.email_verified_at,
  );
  const isBiddingBlockedByEmail = Boolean(
    auction.status === "active" &&
    user &&
    !(user.is_admin || user.is_superuser) &&
    !isEmailVerified,
  );

  return (
    <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/auctions")}
            className="flex items-center text-gray-400 hover:text-pink-400 transition-colors duration-300 group"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Auctions
          </button>
        </div>
        <div className="flex items-center justify-between mb-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide uppercase ${
                isConnected
                  ? "border-green-500/60 bg-green-500/10 text-green-200"
                  : isConnecting
                    ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                    : "border-red-400/60 bg-red-500/10 text-red-200"
              }`}
              aria-live="polite"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? "bg-green-400 animate-pulse"
                    : isConnecting
                      ? "bg-amber-300 animate-pulse"
                      : "bg-red-400"
                }`}
              />
              Live
            </span>
            {!isConnected && (
              <span className="text-xs text-gray-400">
                {isConnecting
                  ? "Connecting to live feed..."
                  : "Live feed disconnected. Trying to reconnect."}
              </span>
            )}
          </div>
        </div>
        {!isConnected && (
          <div
            className="mb-4 rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-3 text-red-100"
            role="status"
          >
            Live updates are currently offline. Bids will refresh once the
            connection returns.
          </div>
        )}
        {/* Auction Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#a020f0]/10">
            <img
              src={auction.image_url || "/assets/nav-logo.svg"}
              alt={auction.title}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={960}
              height={540}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex flex-col space-y-6">
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
              {auction.title}
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              {auction.description}
            </p>

            {/* Price + Highest Bidder */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
                <div>
                  <div
                    id="current-price-label"
                    className="text-sm text-gray-400 uppercase tracking-wider"
                  >
                    Current Price
                  </div>
                  <div
                    className="text-3xl font-bold text-pink-400"
                    aria-labelledby="current-price-label"
                    aria-live="polite"
                  >
                    ${(auction.current_price ?? 0).toFixed(2)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    Time Remaining
                  </div>
                  <Countdown
                    // Assuming Countdown handles its own live announcements.
                    // If not, it should also have aria-live="polite".
                    endTime={auction.end_time}
                    status={auction.status}
                    onEnd={onTimerEnd}
                  />
                </div>
              </div>
              <div
                className="mt-4 pt-4 border-t border-white/10 text-gray-300 text-center sm:text-left"
                data-testid="highest-bidder-info"
              >
                <span aria-live="polite">Highest Bidder: </span>
                {highestBidderUsername ? (
                  <span className="font-semibold text-purple-400">
                    {highestBidderUsername}
                  </span>
                ) : (
                  "None"
                )}
              </div>
            </div>

            {/* Bidding Section */}
            {auction.status === "active" &&
              user &&
              !(user.is_admin || user.is_superuser) && (
                <>
                  {bidError && (
                    <div
                      className="p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-center"
                      role="alert"
                    >
                      {bidError}
                    </div>
                  )}
                  <Suspense
                    fallback={
                      <div className="text-center text-gray-400">
                        Loading bid history...
                      </div>
                    }
                  >
                    <BidHistory bids={bids} />
                  </Suspense>
                  <button
                    onClick={onPlaceBid}
                    disabled={
                      isBidding ||
                      isBiddingBlockedByEmail ||
                      Number(user?.id) === Number(auction.highest_bidder_id)
                    }
                    title={
                      isBiddingBlockedByEmail
                        ? isEmailVerificationUnknown
                          ? "Checking email verification status..."
                          : "Verify your email to place bids."
                        : undefined
                    }
                    className="mt-4 w-full text-lg bg-[#ff69b4] text-[#1a0d2e] px-10 py-4 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a] disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                  >
                    {isBidding
                      ? "Placing Bid..."
                      : isBiddingBlockedByEmail
                        ? isEmailVerificationUnknown
                          ? "Checking verification..."
                          : "Verify email to bid"
                        : Number(user?.id) === Number(auction.highest_bidder_id)
                          ? "You are the highest bidder"
                          : "Place Your Bid"}
                  </button>
                  {isBiddingBlockedByEmail && user?.email_verified === false ? (
                    <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Verify your email to place bids.{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/account/verify-email")}
                        className="font-semibold underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1a] rounded"
                      >
                        Verify now
                      </button>
                    </div>
                  ) : null}
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuctionView = memo(AuctionViewComponent);
