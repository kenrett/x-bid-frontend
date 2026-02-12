import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { AuctionView } from "../AuctionView/AuctionView";
import { useAuctionDetail } from "@features/auctions/hooks/useAuctionDetail";
import { LoadingScreen } from "@components/LoadingScreen";
import { ErrorScreen } from "@components/ErrorScreen";

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
    onTimerEnd,
    connectionState,
    refreshAuction,
  } = useAuctionDetail(auctionId);
  const [hasRetriedImageLoad, setHasRetriedImageLoad] = useState(false);
  const [forceFallbackImage, setForceFallbackImage] = useState(false);
  const [imageRetryAttempt, setImageRetryAttempt] = useState(0);

  const handleImageLoadError = useCallback(async () => {
    if (!hasRetriedImageLoad) {
      setHasRetriedImageLoad(true);
      setForceFallbackImage(false);
      await refreshAuction();
      setImageRetryAttempt((attempt) => attempt + 1);
      return;
    }

    setForceFallbackImage(true);
  }, [hasRetriedImageLoad, refreshAuction]);

  if (error) return <ErrorScreen message={error} />;
  if (loading || !auction) return <LoadingScreen item="auction" />;

  return (
    <AuctionView
      auction={auction}
      user={user}
      isBidding={isBidding}
      bidError={bidError}
      highestBidderUsername={highestBidderDisplay}
      connectionState={connectionState}
      onPlaceBid={placeUserBid}
      onTimerEnd={onTimerEnd}
      bids={bids}
      onImageLoadError={handleImageLoadError}
      forceFallbackImage={forceFallbackImage}
      imageRenderKey={`${auction.image_url ?? "fallback"}:${imageRetryAttempt}:${forceFallbackImage ? "fallback" : "live"}`}
    />
  );
}
