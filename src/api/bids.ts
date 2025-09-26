import client from "./client";
import type { Bid } from "../types/bid";

interface BidResponse {
  bid: Bid;
  message: string;
}

export const placeBid = async (auctionId: number): Promise<BidResponse> => {
  const response = await client.post<BidResponse>(`auctions/${auctionId}/bids`);
  return response.data;
};