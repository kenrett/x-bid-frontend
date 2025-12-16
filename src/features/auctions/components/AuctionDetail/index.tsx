import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { AuctionView } from "../AuctionView/AuctionView";
import { useAuctionDetail } from "@features/auctions/hooks/useAuctionDetail";
import { LoadingScreen } from "@components/LoadingScreen";
import { ErrorScreen } from "@components/ErrorScreen";

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
    connectionState,
  } = useAuctionDetail(auctionId);

  // Callback for when the timer ends
  const onTimerEnd = useCallback(() => {
    // The hook now handles status changes via WebSocket, but a manual
    // update on timer end can be a good fallback.
    // For now, we rely on the server broadcast.
  }, []);

  if (error) return <ErrorScreen message={error} />;
  // Show loading screen if we are fetching or if there's no error but the auction hasn't loaded yet.
  if (loading || !auction) return <LoadingScreen item="auction" />;

  return (
    <AuctionView
      auction={auction}
      user={user}
      isBidding={isBidding}
      bidError={bidError}
      connectionState={connectionState}
      highestBidderUsername={highestBidderUsername ?? "No bids yet"}
      onPlaceBid={placeUserBid}
      onTimerEnd={onTimerEnd}
      bids={bids}
    />
  );
}
