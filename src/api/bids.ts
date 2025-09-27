import client from "./client";
import type { Bid } from "../types/bid";
import type { AuctionData } from "../types/auction";

export const placeBid = async (auctionId: number): Promise<AuctionData> => {
  const response = await client.post(`/auctions/${auctionId}/bids`);
  return response.data.auction;
};

export const getBidHistory = async (auctionId: number): Promise<Bid[]> => {
  const response = await client.get<Bid[]>(`auctions/${auctionId}/bid_history`);
  return response.data;
};
