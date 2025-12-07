import { useEffect } from "react";
import { cable } from "../services/cable";

export function useAuctionChannel<T = unknown>(
  auctionId: number,
  onReceived: (data: T) => void,
) {
  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (data: T) => {
          onReceived(data);
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId, onReceived]);
}
