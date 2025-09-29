import { useEffect, useReducer, useMemo, useCallback } from "react";
import { isAxiosError } from "axios";

import { useAuth } from "./useAuth";
import { getAuction } from "../api/auctions";
import { placeBid, getBidHistory } from "../api/bids";
import { useAuctionChannel } from "./useAuctionChannel";

import type { AuctionData } from "../types/auction";
import type { Bid } from "../types/bid";

/**
 * Defines the shape of the state for an auction detail page.
 * This includes the auction data, bid history, loading/error states,
 * and states related to placing a bid.
 */
interface AuctionState {
  /** The main auction data object. */
  auction: AuctionData | null;
  /** A list of bids placed on the auction. */
  bids: Bid[];
  /** True when initially fetching auction data. */
  loading: boolean;
  /** Holds any error message from fetching data. */
  error: string | null;
  /** True when a bid is currently being placed. */
  isBidding: boolean;
  /** Holds any error message from placing a bid. */
  bidError: string | null;
  /** The username of the current highest bidder. */
  highestBidderUsername: string | null;
  /** The ID of the last user to place a bid, used to prevent race conditions. */
  lastBidderId: number | null;
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

/**
 * Reducer function to manage the state of the auction detail page.
 * It handles state transitions based on dispatched actions.
 * @param state - The current state.
 * @param action - The action to be processed.
 */
function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  // Group console logs for readability for each action processed by the reducer.
  console.group(`[auctionReducer] Action: ${action.type}`);
  console.log('[auctionReducer] State before:', { ...state });
  // Log the payload if it exists to see what data is coming in.
  if ('payload' in action) {
    console.log('[auctionReducer] Action payload:', action.payload);
  }

  let nextState: AuctionState;

  switch (action.type) {
    case "FETCH_INIT":
      nextState = { ...state, loading: true, error: null };
      break;
    case "FETCH_SUCCESS": {
      const { auction, bids } = action.payload;
      nextState = { ...state, loading: false, auction, bids, highestBidderUsername: auction.winning_user_name };
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
      nextState = {
        ...state,
        auction: state.auction ? { ...state.auction, ...updatedAuction } : null,
        bids: [newBid, ...state.bids],
        highestBidderUsername: newBid.username,
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
        console.log('[auctionReducer] Ignoring own bid update from channel.');
        nextState = { ...state, lastBidderId: null };
        break;
      }
      
      // Create a new auction object with updated real-time data
      const updatedAuction = {
        ...state.auction,
        current_price: data.current_price ?? state.auction.current_price, // Use nullish coalescing
        highest_bidder_id: data.highest_bidder_id ?? state.auction.highest_bidder_id,
        end_time: data.end_time ?? state.auction.end_time,
      };
      let updatedBids = [...state.bids];
      if (data.bid && !updatedBids.some(b => b.id === data.bid.id)) {
        const incomingBid = data.bid as Bid;
        updatedBids = [incomingBid, ...updatedBids];
      }
      // Return a completely new state object to guarantee a re-render.
      nextState = {
        ...state,
        auction: updatedAuction,
        bids: updatedBids,
        highestBidderUsername: data.highest_bidder_name ?? state.highestBidderUsername,
        lastBidderId: null, // Reset last bidder ID on any external update
      };
      break;
    }
    default:
      nextState = state;
  }

  console.log('[auctionReducer] State after:', { ...nextState });
  console.groupEnd();
  return nextState;
}

/**
 * The initial state for the auction reducer.
 */
const initialState: AuctionState = { auction: null, bids: [], loading: true, error: null, isBidding: false, bidError: null, highestBidderUsername: null, lastBidderId: null };

/**
 * A custom hook to manage the state and logic for an auction detail page.
 * It fetches auction data, handles real-time updates via WebSockets, and provides
 * a function to place bids.
 * @param auctionId - The ID of the auction to display.
 */
export function useAuctionDetail(auctionId: number) {
  // Get the current authenticated user.
  const { user } = useAuth();
  // Initialize the state and dispatch function using the reducer.
  const [state, dispatch] = useReducer(auctionReducer, initialState);

  // Effect to fetch initial auction details and bid history when the component mounts or auctionId changes.
  useEffect(() => {
    // Don't fetch if the auctionId is not valid.
    if (!auctionId) return;
    const fetchAuction = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        // Fetch auction details and bid history in parallel
        const [auctionData, bidHistoryResponse] = await Promise.all([
          getAuction(auctionId),
          getBidHistory(auctionId),
        ]);
        // Augment the auction data with the winning user info from the bid history response.
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
  }, [auctionId]);

  /**
   * Callback function to handle real-time data received from the AuctionChannel WebSocket.
   * It dispatches a CHANNEL_UPDATE action to update the state.
   */
  const onChannelData = useCallback((data: any) => {
    console.log('%c[onChannelData] Received WebSocket data:', 'color: green', data);
    if (auctionId > 0) {
      dispatch({ type: "CHANNEL_UPDATE", payload: { data } });
    }
  }, [auctionId, dispatch]);

  // Subscribe to the auction's WebSocket channel for real-time updates.
  const auctionSubscription = useAuctionChannel(auctionId, onChannelData);

  /**
   * Function to place a bid on the current auction.
   * It performs several checks before attempting to place the bid.
   */
  const placeUserBid = async () => {
    // Log the state at the moment the user attempts to place a bid.
    console.log('%c[placeUserBid] Attempting to place bid...', 'color: blue');
    console.log('[placeUserBid] Current state:', {
      auctionId: state.auction?.id,
      isBidding: state.isBidding,
      currentHighestBidderId: state.auction?.highest_bidder_id,
      userId: user?.id,
      isSelf: user?.id === state.auction?.highest_bidder_id,
    });
    // Pre-conditions: ensure auction exists, user is logged in, not already bidding,
    // user is not the current highest bidder, and WebSocket subscription is active.
    // The user cannot be the current highest bidder.
    if (!state.auction || !user || state.isBidding || user.id === state.auction.highest_bidder_id || !auctionSubscription) {
      console.error("Cannot place bid. Conditions not met or not subscribed.");
      return;
    }

    dispatch({ type: "BID_START" });
    // Temporarily stop the stream to prevent receiving our own bid update immediately.
    auctionSubscription.perform('stop_stream');
    try {
      // Call the API to place the bid. It returns the updated auction data and the new bid object.
      const { auction: updatedAuctionData, bid: newBid } = await placeBid(state.auction.id);

      // The API response for the auction has `highest_bidder` (string), not `highest_bidder_id`.
      // The `newBid` object, however, contains the correct `user_id` of the highest bidder.
      // We use that to construct the payload for our optimistic update.
      const updatedAuctionWithId = { ...updatedAuctionData, highest_bidder_id: newBid.user_id };

      // Dispatch success action with the new data.
      dispatch({
        type: "BID_SUCCESS",
        // Pass the partial auction update and the new bid directly to the reducer.
        payload: { updatedAuction: updatedAuctionWithId, newBid: newBid },
      });
    } catch (err) {
      // Handle specific API errors or generic errors.
      if (isAxiosError(err) && err.response?.data?.error) {
        dispatch({ type: "BID_FAILURE", payload: err.response.data.error });
      } else {
        dispatch({ type: "BID_FAILURE", payload: "An unexpected error occurred while placing your bid." });
      }
    } finally {
      // Ensure the WebSocket stream is restarted and bidding state is reset, regardless of success or failure.
      if (auctionSubscription) {
        auctionSubscription.perform('start_stream');
      }
    }
  };

  /**
   * Return the complete state, the current user, and the function to place a bid.
   * This provides all necessary data and actions to the component using the hook.
   */
  return {
    ...state,
    user,
    placeUserBid,
  };
}