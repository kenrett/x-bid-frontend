import { cable } from "@/services/cable";
import { Bid } from "@/types/bid";
import { useRef, useEffect } from "react";

type AuctionChannelData = {
  current_price?: number;
  highest_bidder_id?: number;
  end_time?: string;
  bid?: Bid;
};

export function useAuctionChannel(
  auctionId: number,
  onData: (data: AuctionChannelData) => void
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    // Do not subscribe if the auctionId is not valid (e.g., 0 on initial render)
    if (!auctionId || auctionId <= 0) return;

    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (raw) => {
          const data: AuctionChannelData = {
            current_price: raw.current_price ? Number(raw.current_price) : undefined,
            highest_bidder_id:
              raw.highest_bidder_id !== undefined
                ? Number(raw.highest_bidder_id)
                : undefined,
            end_time: raw.end_time, // make sure we propagate end_time
            bid: raw.bid
              ? {
                  id: Number(raw.bid.id),
                  user_id: Number(raw.bid.user_id),
                  username: raw.bid.username,
                  amount: Number(raw.bid.amount),
                  created_at: raw.bid.created_at,
                }
              : undefined,
          };
          console.log("AuctionChannel update:", data);
          onDataRef.current(data);
        },
      }
    );

    return () => subscription.unsubscribe();
  }, [auctionId]);
}
