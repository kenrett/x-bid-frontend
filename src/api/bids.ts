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

export const getBidHistory = async (auctionId: number): Promise<Bid[]> => {
  const response = await client.get<Bid[]>(`auctions/${auctionId}/bid_history`);
  return response.data;
};
