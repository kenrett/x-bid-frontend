import client from "./client";
import type { Bid } from "../types/bid";
import type { AuctionData } from "../types/auction";

export const placeBid = async (auctionId: number): Promise<{ auction: AuctionData, bid: Bid }> => {
  const response = await client.post(`/auctions/${auctionId}/bids`);
  console.log("placeBid response:", response.data)
  return response.data;
};

interface BidHistoryResponse {
  auction: {
    winning_user_id: number | null;
    winning_user_name: string | null;
  };
  bids: Bid[];
}

export const getBidHistory = async (auctionId: number): Promise<BidHistoryResponse> => {
  const response = await client.get<BidHistoryResponse>(`auctions/${auctionId}/bid_history`);
  return response.data;
};
