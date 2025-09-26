import client from "./client";
import type { AuctionData } from "../types/auction";

export const getAuctions = async () => {
  const res = await client.get<AuctionData[]>("/auctions");

  // Rails serializes decimal values as strings. We need to convert them to numbers.
  return res.data.map((auction) => ({
    ...auction,
    current_price: parseFloat(String(auction.current_price)),
  }));
};

export const getAuction = async (id: number) => {
  const res = await client.get<AuctionData>(`/auctions/${id}`);
  // Also parse the price for a single auction
  return {
    ...res.data,
    current_price: parseFloat(String(res.data.current_price)),
  };
};

export const createAuction = async (auction: Pick<AuctionData, "title">) => {
  const res = await client.post<AuctionData>("/auctions", auction);
  return res.data;
};

export const updateAuction = async (id: number, updates: Partial<AuctionData>) => {
  const res = await client.put<AuctionData>(`/auctions/${id}`, updates);
  return res.data;
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
