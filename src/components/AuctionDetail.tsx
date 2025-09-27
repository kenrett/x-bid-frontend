import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { isAxiosError } from "axios";

import { useAuth } from "../hooks/useAuth";
import { useAuctionChannel } from "@/hooks/useAuctionChannel";
import { getAuction } from "../api/auctions";
import { placeBid } from "../api/bids";
import { BidHistory } from "./BidHistory";

import type { AuctionData } from "../types/auction";

// -------------------- Custom Hook --------------------

/**
 * A "headless" component that subscribes to the auction channel.
 * This ensures the useAuctionChannel hook is only called with a valid ID.
 */
function AuctionChannelSubscriber({ auctionId, onData }: { auctionId: number, onData: (data: any) => void }) {
  useAuctionChannel(auctionId, onData);
  return null; // This component does not render anything
}

function useAuctionDetail(id: string | undefined) {
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Fetch auction details
  useEffect(() => {
    if (!id) return;
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const data = await getAuction(Number(id));
        setAuction(data);
      } catch (err) {
        setError("Failed to fetch auction details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  const placeUserBid = async () => {
    // The `user` object is guaranteed to exist here because the bid button
    // is only rendered for authenticated users.
    if (!auction || !user || isBidding || user.id === auction.highest_bidder_id) return;

    setIsBidding(true);
    setBidError(null);
    try {
      await placeBid(auction.id);
      // Optimistic update
      setAuction((prev) => {
        if (!prev) return prev;
        return { ...prev, highest_bidder_id: user.id };
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setBidError(err.response.data.error);
      } else {
        setBidError("An unexpected error occurred while placing your bid.");
      }
    } finally {
      setIsBidding(false);
    }
  };

  return { auction, loading, error, user, isBidding, bidError, placeUserBid, setAuction };
}

// -------------------- UI Components --------------------
function LoadingScreen() {
  return (
    <div className="font-sans bg-[#0d0d1a] text-gray-400 text-lg text-center p-8 min-h-screen">
      Loading auction...
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="font-sans bg-[#0d0d1a] text-red-400 text-lg text-center p-8 min-h-screen">
      {message}
    </div>
  );
}

// -------------------- Main Component --------------------
export function AuctionDetail() {
  const { id } = useParams();
  const {
    auction,
    loading,
    error,
    user,
    isBidding,
    bidError,
    placeUserBid,
    setAuction,
  } = useAuctionDetail(id);

  // Subscribe to auction updates
  const handleAuctionData = useCallback(
    (data: { current_price?: number; highest_bidder_id?: number }) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_price: data.current_price ?? prev.current_price,
              highest_bidder_id:
                data.highest_bidder_id ?? prev.highest_bidder_id,
            }
          : prev
      );
    },
    [setAuction]
  );

  if (loading || !auction) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <>
      <AuctionChannelSubscriber auctionId={auction.id} onData={handleAuctionData} />
      <AuctionView
        auction={auction}
        user={user}
        isBidding={isBidding}
        bidError={bidError}
        onPlaceBid={placeUserBid}
      />
    </>
  );
}

// -------------------- Auction View --------------------
interface AuctionViewProps {
  auction: AuctionData;
  user: { id: number; username: string; is_admin?: boolean } | null;
  isBidding: boolean;
  bidError: string | null;
  onPlaceBid: () => void;
}

function AuctionView({
  auction,
  user,
  isBidding,
  bidError,
  onPlaceBid,
}: AuctionViewProps) {
  const navigate = useNavigate();

  const highestBidder =
    user && auction.highest_bidder_id === user.id
      ? user.username
      : null;

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
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="text-3xl font-bold text-pink-400">
                Current Price: ${auction.current_price.toFixed(2)}
              </div>
              <div className="text-gray-300">
                Highest Bidder:{" "}
                {highestBidder ? (
                  <span className="font-semibold text-purple-400">
                    {highestBidder}
                  </span>
                ) : (
                  "None"
                )}
              </div>
            </div>

            {/* Bidding Section */}
            {auction.status === "active" && user && !user.is_admin && (
              <>
                {bidError && (
                  <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-center">
                    {bidError}
                  </div>
                )}
                <BidHistory auctionId={auction.id} onLatestBid={() => {}} />
                <button
                  onClick={onPlaceBid}
                  disabled={isBidding || user?.id === auction.highest_bidder_id}
                  className="mt-4 w-full text-lg bg-[#ff69b4] text-[#1a0d2e] px-10 py-4 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                >
                  {isBidding
                    ? "Placing Bid..."
                    : user?.id === auction.highest_bidder_id
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
