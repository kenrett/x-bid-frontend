import client from "./client";
import type { AuctionDetail, AuctionSummary } from "../types/auction";
import { statusFromApi } from "./status";

const normalizePrice = (value: unknown) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

export const getAuctions = async () => {
  const res = await client.get<
    AuctionSummary[] | { auctions?: AuctionSummary[] }
  >("/auctions");
  const list = Array.isArray(res.data)
    ? res.data
    : Array.isArray((res.data as { auctions?: AuctionSummary[] }).auctions)
      ? (res.data as { auctions: AuctionSummary[] }).auctions
      : [];

  return list.map((auction) => ({
    ...auction,
    current_price: normalizePrice(auction.current_price),
    status: statusFromApi(auction.status),
  }));
};

export const getAuction = async (id: number) => {
  const res = await client.get<
    AuctionDetail | (AuctionDetail & { bids?: unknown })
  >(`/auctions/${id}`);
  const data = res.data;
  const bids = Array.isArray((data as any).bids) ? (data as any).bids : [];

  return {
    ...data,
    bids,
    current_price: normalizePrice((data as any).current_price),
    status: statusFromApi(data.status),
  };
};
