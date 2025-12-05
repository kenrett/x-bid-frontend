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
    highestBidderDisplay,
    placeUserBid,
    bids,
    onTimerEnd
  } = useAuctionDetail(auctionId);

  if (error) return <ErrorScreen message={error} />;
  if (loading || !auction) return <LoadingScreen item="auction" />;

  return (
    <AuctionView
      auction={auction}
      user={user}
      isBidding={isBidding}
      bidError={bidError}
      highestBidderUsername={highestBidderDisplay}
      onPlaceBid={placeUserBid}
      onTimerEnd={onTimerEnd}
      bids={bids}
    />
  );
}
