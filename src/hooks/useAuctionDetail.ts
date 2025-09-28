import { useEffect, useReducer, useMemo, useCallback } from "react";
import { isAxiosError } from "axios";

import { useAuth } from "./useAuth";
import { getAuction } from "../api/auctions";
import { placeBid, getBidHistory } from "../api/bids";

import type { AuctionData } from "../types/auction";
import type { Bid } from "../types/bid";
import { useAuctionChannel } from "./useAuctionChannel";

interface AuctionState {
  auction: AuctionData | null;
  bids: Bid[];
  loading: boolean;
  error: string | null;
  isBidding: boolean;
  bidError: string | null;
}

type AuctionAction =
  | { type: "FETCH_INIT" }
  | { type: "FETCH_SUCCESS"; payload: { auction: AuctionData; bids: Bid[] } }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "BID_START" }
  | { type: "BID_SUCCESS"; payload: { updatedAuction: Partial<AuctionData>; newBid: Bid } }
  | { type: "BID_FAILURE"; payload: string }
  | { type: "BID_END" }
  | { type: "CHANNEL_UPDATE"; payload: { data: any } };

function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS": {
      const { auction, bids } = action.payload;
      return { ...state, loading: false, auction, bids };
    }
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };
    case "BID_START":
      return { ...state, isBidding: true, bidError: null };
    case "BID_SUCCESS": {
      const { updatedAuction, newBid } = action.payload;
      return {
        ...state,
        auction: state.auction ? { ...state.auction, ...updatedAuction } : null,
        bids: [newBid, ...state.bids],
      };
    }
    case "BID_FAILURE":
      return { ...state, bidError: action.payload };
    case "BID_END":
      return { ...state, isBidding: false };
    case "CHANNEL_UPDATE": {
      const { data } = action.payload;
      if (!state.auction) return state;
      
      // Create a new auction object with updated real-time data
      const updatedAuction = {
        ...state.auction,
        current_price: data.current_price ?? state.auction.current_price,
        highest_bidder_id: data.highest_bidder_id ?? state.auction.highest_bidder_id,
        end_time: data.end_time ?? state.auction.end_time,
      };

      let updatedBids = [...state.bids];
      if (data.bid && !updatedBids.some(b => b.id === data.bid.id)) {
        const incomingBid = data.bid as Bid;
        updatedBids = [incomingBid, ...updatedBids];
      }

      return { ...state, auction: updatedAuction, bids: updatedBids };
    }
    default:
      return state;
  }
}

const initialState: AuctionState = { auction: null, bids: [], loading: true, error: null, isBidding: false, bidError: null };

export function useAuctionDetail(id: string | undefined) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(auctionReducer, initialState);

  // Fetch auction details on mount
  useEffect(() => {
    if (!id) return;
    const fetchAuction = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        // Fetch auction details and bid history in parallel
        const [auctionData, bidHistoryResponse] = await Promise.all([
          getAuction(Number(id)),
          getBidHistory(Number(id)),
        ]);
        // Combine the auction data with the winning user from the bid history
        auctionData.highest_bidder_id = bidHistoryResponse.auction.winning_user_id ?? auctionData.highest_bidder_id;
        auctionData.winning_user_name = bidHistoryResponse.auction.winning_user_name;
        const bidHistory = bidHistoryResponse.bids;
        dispatch({ type: "FETCH_SUCCESS", payload: { auction: auctionData, bids: bidHistory } });
      } catch (err) {
        dispatch({ type: "FETCH_FAILURE", payload: "Failed to fetch auction details." });
        console.error(err);
      }
    };
    fetchAuction();
  }, [id]);

  // Handle real-time updates from the AuctionChannel
  const auctionId = Number(id);
  const onChannelData = useCallback((data: any) => {
    if (auctionId > 0) {
      dispatch({ type: "CHANNEL_UPDATE", payload: { data } });
    }
  }, [auctionId]); // Dependency on auctionId ensures we don't use a stale ID

  useAuctionChannel(auctionId, onChannelData);

  // Place a bid
  const placeUserBid = async () => {
    if (!state.auction || !user || state.isBidding || user.id === state.auction.highest_bidder_id) return;

    dispatch({ type: "BID_START" });
    try {
      // The API now returns both the updated auction and the new bid
      const { auction: updatedAuctionData, bid: newBid } = await placeBid(state.auction.id);

      const updatedAuction = {
        highest_bidder_id: updatedAuctionData.highest_bidder_id,
        current_price: updatedAuctionData.current_price,
        end_time: updatedAuctionData.end_time,
      };

      dispatch({
        type: "BID_SUCCESS",
        // We use the authoritative data from the API response
        payload: { updatedAuction, newBid },
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        dispatch({ type: "BID_FAILURE", payload: err.response.data.error });
      } else {
        dispatch({ type: "BID_FAILURE", payload: "An unexpected error occurred while placing your bid." });
      }
    } finally {
      dispatch({ type: "BID_END" });
    }
  };

  const highestBidderUsername = useMemo(() => {
    if (!state.auction || !state.auction.highest_bidder_id) return null;
    // On initial load, the backend provides the winner's name directly.
    if (state.auction.winning_user_name) return state.auction.winning_user_name;

    if (state.bids.length === 0) return null;

    // Find the most recent bid from the highest bidder to get their username
    const highestBid = state.bids.find(bid => bid.user_id === state.auction!.highest_bidder_id);
    return highestBid?.username ?? null;
  }, [state.auction, state.bids]);

  return {
    ...state,
    highestBidderUsername,
    user,
    placeUserBid,
  };
}