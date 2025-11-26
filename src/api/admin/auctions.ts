import client from "../client";
import type { AuctionData } from "../../types/auction";

export const createAuction = async (
  payload: Partial<AuctionData> & { title: string }
) => {
  const res = await client.post<AuctionData>("/auctions", payload);
  return res.data;
};

export const updateAuction = async (
  id: number,
  updates: Partial<AuctionData>
) => {
  const res = await client.put<AuctionData>(`/auctions/${id}`, updates);
  return res.data;
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
