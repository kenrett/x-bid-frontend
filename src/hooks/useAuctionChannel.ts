import { cable } from "@/services/cable";
import { Bid } from "@/types/bid";
import { useRef, useEffect, useState } from "react";

export type AuctionChannelData = {
  current_price?: number;
  highest_bidder_id?: number;
  highest_bidder_name?: string;
  end_time?: string;
  bid?: Bid;
};

// Define the shape of the raw data from the WebSocket, where numbers might be strings.
type RawAuctionChannelData = {
  current_price?: string;
  highest_bidder_id?: string | number;
  highest_bidder_name?: string;
  end_time?: string;
  bid?: {
    id: string | number;
    user_id: string | number;
    username: string;
    amount: string | number;
    created_at: string;
  };
};

export function useAuctionChannel(
  auctionId: number,
  onData: (data: AuctionChannelData) => void,
) {
  const onDataRef = useRef(onData);
  const [subscription, setSubscription] = useState<ReturnType<
    typeof cable.subscriptions.create
  > | null>(null);
  onDataRef.current = onData;

  useEffect(() => {
    // Do not subscribe if the auctionId is not valid
    if (!auctionId || auctionId <= 0) return;

    // console.log(`[AuctionChannel] creating subscription for auction ${auctionId}`);

    // Create and set the subscription object
    const sub = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        connected: () => {
          // console.log("[AuctionChannel] connected");
        },
        disconnected: () => {
          // console.log("[AuctionChannel] disconnected");
        },
        rejected: () => {
          // console.warn("[AuctionChannel] subscription rejected");
        },
        received: (raw: RawAuctionChannelData) => {
          const data: AuctionChannelData = {
            current_price: raw.current_price
              ? Number(raw.current_price)
              : undefined,
            // Use the bid's user info as the source of truth for the new highest bidder
            // if it's not present at the top level of the broadcast.
            highest_bidder_name: raw.highest_bidder_name ?? raw.bid?.username,
            highest_bidder_id:
              raw.highest_bidder_id !== undefined
                ? Number(raw.highest_bidder_id)
                : raw.bid?.user_id !== undefined
                  ? Number(raw.bid.user_id)
                  : undefined,
            end_time: raw.end_time, // make sure we propagate end_time
            bid: raw.bid
              ? {
                  ...raw.bid,
                  id: Number(raw.bid.id),
                  user_id: Number(raw.bid.user_id),
                  amount: Number(raw.bid.amount),
                }
              : undefined,
          };
          // console.log("[AuctionChannel] Received broadcast data:", data);
          onDataRef.current(data);
        },
      },
    );
    setSubscription(sub);

    return () => {
      // console.log(`[AuctionChannel] cleanup for auction ${auctionId}`);
      sub.unsubscribe();
      setSubscription(null);
    };
  }, [auctionId]);

  return subscription;
}
