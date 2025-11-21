import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import { AuctionView } from "../AuctionView/AuctionView";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";
import { LoadingScreen } from "../LoadingScreen";
import { ErrorScreen } from "../ErrorScreen";

// Wrapper: validate route params, then render the "real" component
export function AuctionDetail() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorScreen message="Auction ID is missing from the URL." />;
  }

  const auctionId = Number.parseInt(id, 10);
  if (Number.isNaN(auctionId) || auctionId <= 0) {
    return <ErrorScreen message="Invalid auction ID." />;
  }

  return <AuctionDetailInner auctionId={auctionId} />;
}

function AuctionDetailInner({ auctionId }: { auctionId: number }) {
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
    refreshAuction
  } = useAuctionDetail(auctionId);
  const lastRefreshEndTimeRef = useRef<string | null>(null);

  useEffect(() => {
    lastRefreshEndTimeRef.current = null;
  }, [auctionId]);

  // Avoid repeatedly refetching if the server returns the same expired end_time.
  const onTimerEnd = useCallback(() => {
    const currentEndTime = auction?.end_time ?? null;
    if (lastRefreshEndTimeRef.current === currentEndTime) return;

    lastRefreshEndTimeRef.current = currentEndTime;
    // When the countdown hits zero, pull the latest state from the server.
    // This will tell us definitively if there is a winner and who it is.
    void refreshAuction();
  }, [auction?.end_time, refreshAuction]);

  if (error) return <ErrorScreen message={error} />;
  if (loading || !auction) return <LoadingScreen item="auction" />;

  return (
    <AuctionView
      auction={auction}
      user={user}
      isBidding={isBidding}
      bidError={bidError}
      highestBidderUsername={highestBidderUsername ?? "No bids yet"}
      onPlaceBid={placeUserBid}
      onTimerEnd={onTimerEnd}
      bids={bids}
    />
  );
}
