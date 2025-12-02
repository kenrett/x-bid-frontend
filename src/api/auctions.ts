import client from "./client";
import type { AuctionData, AuctionStatus } from "../types/auction";

const normalizeStatus = (status: string | undefined): AuctionStatus => {
  if (status === "pending") return "scheduled";
  if (status === "ended") return "complete";
  if (status === "cancelled") return "cancelled";
  if (status === "active") return "active";
  if (status === "scheduled") return "scheduled";
  if (status === "complete") return "complete";
  return "inactive";
};

export const getAuctions = async () => {
  const res = await client.get<AuctionData[]>("/auctions");

  return res.data.map((auction) => ({
    ...auction,
    current_price: parseFloat(String(auction.current_price)),
    status: normalizeStatus(auction.status),
  }));
};

export const getAuction = async (id: number) => {
  const res = await client.get<AuctionData>(`/auctions/${id}`);

  return {
    ...res.data,
    current_price: parseFloat(String(res.data.current_price)),
    status: normalizeStatus(res.data.status),
  };
};
