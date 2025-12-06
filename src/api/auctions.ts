import client from "./client";
import type { AuctionDetail, AuctionSummary } from "../types/auction";
import type { Bid } from "../types/bid";
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
    | AuctionDetail
    | (AuctionDetail & { bids?: unknown })
    | { auction?: AuctionDetail | (AuctionDetail & { bids?: unknown }) }
  >(`/auctions/${id}`);
  const data = res.data;

  const rawAuction: AuctionDetail | (AuctionDetail & { bids?: unknown }) =
    (data as { auction?: AuctionDetail }).auction ?? (data as AuctionDetail);

  const bids: Bid[] = Array.isArray((rawAuction as { bids?: unknown }).bids)
    ? ((rawAuction as { bids?: unknown }).bids as Bid[])
    : Array.isArray((data as { bids?: unknown }).bids)
      ? ((data as { bids?: unknown }).bids as Bid[])
      : [];

  return {
    ...rawAuction,
    bids,
    current_price: normalizePrice(rawAuction.current_price),
    status: statusFromApi(rawAuction.status),
  };
};
