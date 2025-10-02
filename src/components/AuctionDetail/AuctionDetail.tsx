import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { AuctionView } from "../AuctionView";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";

// -------------------- UI Components --------------------

/**
 * A "headless" component that subscribes to the auction channel.
 * This ensures the useAuctionChannel hook is only called with a valid ID.
 */

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
  const { id } = useParams<{ id: string }>();
  const auctionId = id ? parseInt(id, 10) : 0;
  const {
    auction,
    loading,
    error,
    user,
    isBidding,
    bidError,
    highestBidderUsername,
    placeUserBid,
    bids,
  } = useAuctionDetail(auctionId);

  // Callback for when the timer ends
  const onTimerEnd = useCallback(() => {
    // The hook now handles status changes via WebSocket, but a manual
    // update on timer end can be a good fallback.
    // For now, we rely on the server broadcast.
  }, []);

  if (error) return <ErrorScreen message={error} />;
  // Show loading screen if we are fetching or if there's no error but the auction hasn't loaded yet.
  if (loading || !auction) return <LoadingScreen />;

  return (
    <>
      <AuctionView
        auction={auction}
        user={user}
        isBidding={isBidding}
        bidError={bidError}
        highestBidderUsername={highestBidderUsername}
        onPlaceBid={placeUserBid}
        onTimerEnd={onTimerEnd}
        bids={bids}
      />
    </>
  );
}
