import client from "./client";
import type { Auction } from "../types/auction";

export const getAuctions = async () => {
  const res = await client.get<Auction[]>("/auctions");
  return res.data;
};

export const createAuction = async (auction: Pick<Auction, "title">) => {
  const res = await client.post<Auction>("/auctions", auction);
  return res.data;
};

export const updateAuction = async (id: number, updates: Partial<Auction>) => {
  const res = await client.put<Auction>(`/auctions/${id}`, updates);
  return res.data;
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
