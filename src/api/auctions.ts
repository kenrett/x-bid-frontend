import client from "./client";
import type { AuctionDetail, AuctionStatus, AuctionSummary } from "../types/auction";

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
  const res = await client.get<AuctionSummary[] | { auctions?: AuctionSummary[] }>("/auctions");
  const list = Array.isArray(res.data)
    ? res.data
    : Array.isArray((res.data as { auctions?: AuctionSummary[] }).auctions)
      ? (res.data as { auctions: AuctionSummary[] }).auctions
      : [];

  return list.map((auction) => ({
    ...auction,
    current_price: parseFloat(String(auction.current_price)),
    status: normalizeStatus(auction.status),
  }));
};

export const getAuction = async (id: number) => {
  const res = await client.get<AuctionDetail | (AuctionDetail & { bids?: unknown })>(`/auctions/${id}`);
  const data = res.data;
  const bids = Array.isArray((data as any).bids) ? (data as any).bids : [];

  return {
    ...data,
    bids,
    current_price: parseFloat(String(data.current_price)),
    status: normalizeStatus(data.status),
  };
};
