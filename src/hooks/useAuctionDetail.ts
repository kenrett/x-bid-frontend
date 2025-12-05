import { useEffect, useReducer, useCallback, useRef } from "react";
import { isAxiosError } from "axios";

import { useAuth } from "@hooks/useAuth";
import { getAuction } from "@api/auctions";
import { placeBid, getBidHistory } from "@api/bids";
import { useAuctionChannel, type AuctionChannelData } from "@hooks/useAuctionChannel";

import type { AuctionDetail } from "../types/auction";
import type { Bid } from "../types/bid";

/**
 * Defines the shape of the state for an auction detail page.
 * This includes the auction data, bid history, loading/error states,
 * and states related to placing a bid.
 */
interface AuctionState {
  auction: AuctionDetail | null;
  bids: Bid[];
  loading: boolean;
  error: string | null;
  isBidding: boolean;
  bidError: string | null;
  lastBidderId: number | null;
}

type AuctionAction =
  | { type: "FETCH_INIT" }
  | { type: "FETCH_SUCCESS"; payload: { auction: AuctionDetail; bids: Bid[] } }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "BID_START" }
  | { type: "BID_SUCCESS"; payload: { updatedAuction: Partial<AuctionDetail>; newBid: Bid } }
  | { type: "BID_FAILURE"; payload: string }
  | { type: "BID_END" }
  | { type: "CHANNEL_UPDATE"; payload: { data: AuctionChannelData } };

/**
 * Reducer function to manage the state of the auction detail page.
 * It handles state transitions based on dispatched actions.
 * @param state - The current state.
 * @param action - The action to be processed.
 */
function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  let nextState: AuctionState;

  switch (action.type) {
    case "FETCH_INIT":
      nextState = { ...state, loading: true, error: null };
      break;
    case "FETCH_SUCCESS": {
      const { auction, bids } = action.payload;
      nextState = { ...state, loading: false, auction, bids };
      break;
    }
    case "FETCH_FAILURE":
      nextState = { ...state, loading: false, error: action.payload };
      break;
    case "BID_START":
      nextState = { ...state, isBidding: true, bidError: null };
      break;
    case "BID_SUCCESS": {
      const { updatedAuction, newBid } = action.payload;
      // Prevent adding a duplicate bid if the reducer runs twice
      // or if a channel update has already added this bid.
      const bidExists = state.bids.some(bid => bid.id === newBid.id);
      const newBids = bidExists ? state.bids : [newBid, ...state.bids];

      nextState = {
        ...state,
        auction: state.auction ? { ...state.auction, ...updatedAuction } : null,
        bids: newBids,
        isBidding: false, // Reset the bidding flag
        lastBidderId: newBid.user_id, // Set the last bidder ID to prevent race conditions
      };
      break;
    }
    case "BID_FAILURE": {
      // On failure, re-enable bidding and show an error.
      nextState = { ...state, isBidding: false, bidError: action.payload };
      break;
    } case "BID_END":
      nextState = { ...state, isBidding: false };
      break;
    case "CHANNEL_UPDATE": {
      const { data } = action.payload;
      if (!state.auction) {
        nextState = state;
        break;
      }
      // If the channel update is for the user who just bid, ignore it to prevent state overwrites.
      if (data.bid && data.bid.user_id === state.lastBidderId) {
        // console.log('[auctionReducer] Ignoring own bid update from channel.');
        nextState = { ...state, lastBidderId: null };
        break;
      }
      
      const updatedAuction = {
        ...state.auction,
        // Fall back to incoming bid amount if current_price is not broadcast separately.
        current_price: data.current_price ?? data.bid?.amount ?? state.auction.current_price,
        highest_bidder_id: data.highest_bidder_id ?? data.bid?.user_id ?? state.auction.highest_bidder_id,
        end_time: data.end_time ?? state.auction.end_time,
      };
      let updatedBids = [...state.bids];
      if (data.bid && !updatedBids.some(b => b.id === data.bid?.id)) {
        const incomingBid = data.bid as Bid;
        updatedBids = [incomingBid, ...updatedBids];
      }
      nextState = {
        ...state,
        auction: updatedAuction,
        bids: updatedBids,
        lastBidderId: null,
      };
      break;
    }
    default:
      nextState = state;
  }

  // console.log('[auctionReducer] State after:', { ...nextState });
  console.groupEnd();
  return nextState;
}

/**
 * The initial state for the auction reducer.
 */
const initialState: AuctionState = { auction: null, bids: [], loading: true, error: null, isBidding: false, bidError: null, lastBidderId: null };

/**
 * A custom hook to manage the state and logic for an auction detail page.
 * It fetches auction data, handles real-time updates via WebSockets, and provides
 * a function to place bids.
 * @param auctionId - The ID of the auction to display.
 */
export function useAuctionDetail(auctionId: number) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(auctionReducer, initialState);
  const lastRefreshEndTimeRef = useRef<string | null>(null);

  const refreshAuction = useCallback(async () => {
    if (!auctionId) return;

    dispatch({ type: "FETCH_INIT" });

    try {
      const [auctionData, bidHistoryResponse] = await Promise.all([
        getAuction(auctionId),
        getBidHistory(auctionId),
      ]);

      auctionData.highest_bidder_id =
      bidHistoryResponse.auction.winning_user_id ??
      auctionData.highest_bidder_id;
      auctionData.winning_user_name =
      bidHistoryResponse.auction.winning_user_name;

      const bidHistory = bidHistoryResponse.bids;

      dispatch({
        type: "FETCH_SUCCESS",
        payload: { auction: auctionData, bids: bidHistory },
      });
    } catch (err) {
      dispatch({
        type: "FETCH_FAILURE",
        payload: "Failed to fetch auction details.",
      });
      console.error(err);
    }
  }, [auctionId]);

  useEffect(() => {
    lastRefreshEndTimeRef.current = null;
    void refreshAuction();
  }, [refreshAuction]);

  const onChannelData = useCallback(
    (data: AuctionChannelData) => {
      console.log(
        "%c[onChannelData] Received WebSocket data:",
        "color: green",
        data,
      );
      if (auctionId > 0) {
        dispatch({ type: "CHANNEL_UPDATE", payload: { data } });
      }
    },
    [auctionId],
  );

  const auctionSubscription = useAuctionChannel(auctionId, onChannelData);

  const placeUserBid = async () => {
    console.log("%c[placeUserBid] Attempting to place bid...", "color: blue");
    console.log("[placeUserBid] Current state:", {
      auctionId: state.auction?.id,
      isBidding: state.isBidding,
      currentHighestBidderId: state.auction?.highest_bidder_id,
      userId: user?.id,
      isSelf: user?.id === state.auction?.highest_bidder_id,
    });

    if (
      !state.auction ||
      !user ||
      state.isBidding ||
      user.id === state.auction.highest_bidder_id ||
      !auctionSubscription
    ) {
      console.error("Cannot place bid. Conditions not met or not subscribed.");
      return;
    }

    dispatch({ type: "BID_START" });

    try {
      const { auction: updatedAuctionData, bid: newBid } = await placeBid(
        state.auction.id,
      );

      const normalizedBid: Bid = {
        ...newBid,
        id: Number(newBid.id),
        user_id: Number(newBid.user_id),
        amount: Number(newBid.amount),
        username: user!.name,
      };

      const baseAuction = (updatedAuctionData ?? state.auction)!;
      const updatedAuctionWithId = {
        ...baseAuction,
        highest_bidder_id: normalizedBid.user_id,
        current_price: Number(
          updatedAuctionData?.current_price ??
          normalizedBid.amount ??
          baseAuction.current_price ??
          0
        ),
      };

      dispatch({
        type: "BID_SUCCESS",
        payload: { updatedAuction: updatedAuctionWithId, newBid: normalizedBid },
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        dispatch({ type: "BID_FAILURE", payload: err.response.data.error });
      } else {
        dispatch({
          type: "BID_FAILURE",
          payload:
            "An unexpected error occurred while placing your bid.",
        });
      }
    } finally {
      // Keep the channel open; we rely on lastBidderId to ignore our own echoes.
    }
  };

  const handleTimerEnd = useCallback(() => {
    const currentEndTime = state.auction?.end_time ?? null;
    if (lastRefreshEndTimeRef.current === currentEndTime) return;
    lastRefreshEndTimeRef.current = currentEndTime;
    void refreshAuction();
  }, [refreshAuction, state.auction?.end_time]);

  const highestBidderDisplay =
    // Backend guarantees bids are newest-first.
    state.auction?.winning_user_name ??
    state.bids[0]?.username ??
    "No bids yet";

  return {
    ...state,
    user,
    placeUserBid,
    refreshAuction,
    onTimerEnd: handleTimerEnd,
    highestBidderDisplay,
  };
}
