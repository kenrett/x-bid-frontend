import { memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import { Countdown } from "../Countdown/Countdown"; // Assuming Countdown is a named export
const BidHistory = lazy(() =>
  import("../BidHistory/BidHistory").then((module) => ({ default: module.BidHistory }))
);

import type { AuctionData } from "../../types/auction";
import type { Bid } from "../../types/bid";

interface AuctionViewProps {
  auction: AuctionData;
  user: { id: number; name: string; is_admin?: boolean } | null;
  isBidding: boolean;
  bidError: string | null;
  highestBidderUsername: string | null;
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
  onPlaceBid,
  onTimerEnd,
  bids,
}: AuctionViewProps) => {
  const navigate = useNavigate();

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

        {/* Auction Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#a020f0]/10">
            <img
              src={auction.image_url}
              alt={auction.title}
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
                  <div id="current-price-label" className="text-sm text-gray-400 uppercase tracking-wider">Current Price</div>
                  <div
                    className="text-3xl font-bold text-pink-400"
                    aria-labelledby="current-price-label"
                    aria-live="polite"
                  >
                    ${Number(auction.current_price).toFixed(2)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Time Remaining</div>
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
                <span
                  aria-live="polite"
                >
                  Highest Bidder:{" "}
                </span>
                {highestBidderUsername ? (
                  <span className="font-semibold text-purple-400">{highestBidderUsername}</span>
                ) : (
                  "None"
                )}
              </div>
            </div>

            {/* Bidding Section */}
            {auction.status === "active" && user && !user.is_admin && (
              <>
                {bidError && (
                  <div
                    className="p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-center"
                    role="alert"
                  >
                    {bidError}
                  </div>
                )}
                <Suspense fallback={<div className="text-center text-gray-400">Loading bid history...</div>}>
                  <BidHistory bids={bids} />
                </Suspense>
                <button
                  onClick={onPlaceBid}
                  disabled={isBidding || Number(user?.id) === Number(auction.highest_bidder_id)}
                  className="mt-4 w-full text-lg bg-[#ff69b4] text-[#1a0d2e] px-10 py-4 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                >
                  {isBidding
                    ? "Placing Bid..."
                    : Number(user?.id) === Number(auction.highest_bidder_id)
                    ? "You are the highest bidder"
                    : "Place Your Bid"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const AuctionView = memo(AuctionViewComponent);