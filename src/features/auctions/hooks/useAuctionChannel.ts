import { cable } from "@services/cable";
import { Bid } from "../types/bid";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@features/auth/hooks/useAuth";

export type AuctionConnectionState =
  | "connecting"
  | "connected"
  | "disconnected";

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
  const { accessToken, sessionTokenId } = useAuth();
  const isAuthenticated = Boolean(accessToken && sessionTokenId);
  const onDataRef = useRef(onData);
  const [connectionState, setConnectionState] =
    useState<AuctionConnectionState>("disconnected");
  const [subscription, setSubscription] = useState<ReturnType<
    typeof cable.subscriptions.create
  > | null>(null);
  onDataRef.current = onData;

  useEffect(() => {
    // Do not subscribe if the auctionId is not valid
    if (!auctionId || auctionId <= 0 || !isAuthenticated) {
      setConnectionState("disconnected");
      return;
    }

    // console.log(`[AuctionChannel] creating subscription for auction ${auctionId}`);
    setConnectionState("connecting");

    // Create and set the subscription object
    const callbacks = {
      connected: () => {
        setConnectionState("connected");
        // console.log("[AuctionChannel] connected");
      },
      disconnected: () => {
        setConnectionState("disconnected");
        // console.log("[AuctionChannel] disconnected");
      },
      rejected: () => {
        setConnectionState("disconnected");
        // console.warn("[AuctionChannel] subscription rejected");
      },
      received: (raw: unknown) => {
        const rawData = (raw ?? {}) as RawAuctionChannelData;
        const data: AuctionChannelData = {
          current_price: rawData.current_price
            ? Number(rawData.current_price)
            : undefined,
          // Use the bid's user info as the source of truth for the new highest bidder
          // if it's not present at the top level of the broadcast.
          highest_bidder_name:
            rawData.highest_bidder_name ?? rawData.bid?.username,
          highest_bidder_id:
            rawData.highest_bidder_id !== undefined
              ? Number(rawData.highest_bidder_id)
              : rawData.bid?.user_id !== undefined
                ? Number(rawData.bid.user_id)
                : undefined,
          end_time: rawData.end_time, // make sure we propagate end_time
          bid: rawData.bid
            ? {
                ...rawData.bid,
                id: Number(rawData.bid.id),
                user_id: Number(rawData.bid.user_id),
                amount: Number(rawData.bid.amount),
              }
            : undefined,
        };
        // console.log("[AuctionChannel] Received broadcast data:", data);
        onDataRef.current(data);
      },
    };

    const sub = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      callbacks as Parameters<typeof cable.subscriptions.create>[1],
    );
    setSubscription(sub);

    return () => {
      // console.log(`[AuctionChannel] cleanup for auction ${auctionId}`);
      setConnectionState("disconnected");
      sub.unsubscribe();
      setSubscription(null);
    };
  }, [auctionId, isAuthenticated]);

  return { subscription, connectionState };
}
