import { useCallback, useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { useAuctionChannel } from "@/hooks/useAuctionChannel";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";
import { AuctionView } from "./AuctionView";
import type { Bid } from "../types/bid";

interface AuctionUpdateData {
  current_price?: number;
  highest_bidder_id?: number;
  end_time?: string;
  bid?: Bid;
}

// -------------------- UI Components --------------------

/**
 * A "headless" component that subscribes to the auction channel.
 * This ensures the useAuctionChannel hook is only called with a valid ID.
 */
function AuctionChannelSubscriber({
  auctionId,
  onData,
}: { auctionId: number; onData: (data: AuctionUpdateData) => void }) {
  useAuctionChannel(auctionId, onData);
  return null; // This component does not render anything
}

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
    highestBidderUsername,
    placeUserBid,
    handleLatestBid,
    setAuction,
  } = useAuctionDetail(id);
  const [bids, setBids] = useState<Bid[]>([]);

  // Subscribe to auction updates
  const handleAuctionData = useCallback(
    (data: AuctionUpdateData) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_price: data.current_price ?? prev.current_price,
              highest_bidder_id: data.highest_bidder_id ?? prev.highest_bidder_id,
              end_time: data.end_time ?? prev.end_time,
            }
          : prev
      );
      if (data.bid) {
        setBids((prevBids) => [data.bid!, ...prevBids]);
      }
    },
    [setAuction]
  );

  // Set initial bids once auction data is loaded
  useEffect(() => {
    if (auction?.bids && Array.isArray(auction.bids)) {
      setBids(auction.bids);
    }
  }, [auction?.bids]);

  // Callback for when the timer ends
  const onTimerEnd = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, status: "complete" } : prev));
  }, [setAuction]);

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
        highestBidderUsername={highestBidderUsername}
        onPlaceBid={placeUserBid}
        onTimerEnd={onTimerEnd}
        bids={bids}
        onLatestBid={handleLatestBid}
      />
    </>
  );
}
