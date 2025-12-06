import { useEffect } from "react";
import { cable } from "../services/cable";

export function useAuctionChannel(
  auctionId: number,
  onReceived: (data: unknown) => void,
) {
  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (data: unknown) => {
          onReceived(data);
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId, onReceived]);
}
