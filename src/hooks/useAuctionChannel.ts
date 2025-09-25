import { useEffect } from "react";
import { cable } from "../services/cable";
import type { Bid } from "../types/bid";

type AuctionChannelData = {
  current_price?: number;
  highest_bidder_id?: number;
  bid?: Bid;
};

export function useAuctionChannel(
  auctionId: number,
  onReceived: (data: AuctionChannelData) => void
) {
  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (data) => {
          onReceived(data as AuctionChannelData);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId, onReceived]);
}
