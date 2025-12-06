import client from "./client";
import type { Bid } from "../types/bid";
import type { AuctionDetail } from "../types/auction";

interface PlaceBidResponse {
  success: boolean;
  bid: Bid;
  bidCredits?: number;
  auction?: AuctionDetail;
}

export const placeBid = async (
  auctionId: number,
): Promise<PlaceBidResponse> => {
  const response = await client.post(`/auctions/${auctionId}/bids`);
  return response.data;
};

interface BidHistoryResponse {
  auction: {
    winning_user_id: number | null;
    winning_user_name: string | null;
  };
  bids: Bid[];
}

export const getBidHistory = async (
  auctionId: number,
): Promise<BidHistoryResponse> => {
  const response = await client.get<BidHistoryResponse>(
    `auctions/${auctionId}/bid_history`,
  );
  return response.data;
};
