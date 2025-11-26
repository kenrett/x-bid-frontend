import client from "./client";
import type { AuctionData } from "../types/auction";

export const getAuctions = async () => {
  const res = await client.get<AuctionData[]>("/auctions");

  return res.data.map((auction) => ({
    ...auction,
    current_price: parseFloat(String(auction.current_price)),
  }));
};

export const getAuction = async (id: number) => {
  const res = await client.get<AuctionData>(`/auctions/${id}`);

  return {
    ...res.data,
    current_price: parseFloat(String(res.data.current_price)),
  };
};
