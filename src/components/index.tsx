import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { AuctionView } from "../components/AuctionView";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";
import { LoadingScreen } from "./LoadingScreen";
import { ErrorScreen } from "./ErrorScreen";

// -------------------- Main Component --------------------

/**
 * A container component that fetches and manages the state for a single auction,
 * then passes it to the presentational AuctionView component.
 */
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

  if (loading || !auction) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

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
