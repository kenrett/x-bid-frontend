import { useEffect } from "react";
import { cable } from "@services/cable";
import { useAuth } from "@features/auth/hooks/useAuth";

export function useAuctionChannel<T = unknown>(
  auctionId: number,
  onReceived: (data: T) => void,
) {
  const { accessToken, sessionTokenId } = useAuth();
  const isAuthenticated = Boolean(accessToken && sessionTokenId);

  useEffect(() => {
    if (!isAuthenticated) return;
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", auction_id: auctionId },
      {
        received: (data: unknown) => {
          onReceived(data as T);
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId, onReceived, isAuthenticated]);
}
