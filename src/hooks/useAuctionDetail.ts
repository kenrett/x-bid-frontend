import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";

import { useAuth } from "./useAuth";
import { getAuction } from "../api/auctions";
import { placeBid } from "../api/bids";

import type { AuctionData } from "../types/auction";
import type { Bid } from "../types/bid";

export function useAuctionDetail(id: string | undefined) {
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [highestBidderUsername, setHighestBidderUsername] = useState<string | null>(null);

  // Fetch auction details on mount
  useEffect(() => {
    if (!id) return;
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const data = await getAuction(Number(id));
        setAuction(data);
      } catch (err) {
        setError("Failed to fetch auction details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  // Set initial highest bidder username from fetched bids
  useEffect(() => {
    if (auction?.bids && Array.isArray(auction.bids) && auction.bids.length > 0) {
      // The first bid in the array is the most recent one
      setHighestBidderUsername(auction.bids[0].username);
    }
  }, [auction]);

  // Callback to update the highest bidder from BidHistory
  const handleLatestBid = useCallback((bid: Bid | null) => {
    setHighestBidderUsername(bid?.username ?? null);
  }, []);

  // Place a bid
  const placeUserBid = async () => {
    if (!auction || !user || isBidding || user.id === auction.highest_bidder_id) return;

    setIsBidding(true);
    setBidError(null);
    try {
      const updatedAuction = await placeBid(auction.id);
      // Optimistic update
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          highest_bidder_id: user.id,
          // Use the new end_time from the API response for an instant timer reset
          end_time: updatedAuction.end_time,
        };
      });
      setHighestBidderUsername(user.name);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setBidError(err.response.data.error);
      } else {
        setBidError("An unexpected error occurred while placing your bid.");
      }
    } finally {
      setIsBidding(false);
    }
  };

  return {
    auction,
    loading,
    error,
    user,
    isBidding,
    bidError,
    highestBidderUsername,
    placeUserBid,
    setAuction,
    handleLatestBid,
  };
}