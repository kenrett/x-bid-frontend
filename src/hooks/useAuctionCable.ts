import { useEffect } from "react";
import { cable } from "../services/cable";

export function useAuctionChannel(auctionId: number, onReceived: (data: any) => void) {
  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (data) => {
          onReceived(data);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId, onReceived]);
}
