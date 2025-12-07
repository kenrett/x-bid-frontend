import client from "./client";
import type { AuctionDetail, AuctionSummary } from "../types/auction";
import type { Bid } from "../types/bid";
import type { ApiJsonResponse } from "./openapi-helpers";
import { statusFromApi } from "./status";

const normalizePrice = (value: unknown) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

export const getAuctions = async () => {
  const res = await client.get<
    ApiJsonResponse<"/api/v1/auctions", "get"> | { auctions?: unknown }
  >("/auctions");

  const payload = res.data as
    | ApiJsonResponse<"/api/v1/auctions", "get">
    | { auctions?: unknown };

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { auctions?: unknown }).auctions)
      ? ((payload as { auctions: unknown[] }).auctions as AuctionSummary[])
      : [];

  return list.map((auction) => ({
    ...auction,
    current_price: normalizePrice(auction.current_price),
    status: statusFromApi(auction.status),
  }));
};

type AuctionShowResponse =
  | ApiJsonResponse<"/api/v1/auctions/{id}", "get">
  | { auction?: unknown };

type AuctionShowRecord = AuctionShowResponse extends { auction: infer A }
  ? A
  : AuctionShowResponse;

const normalizeAuctionDetail = (
  raw: AuctionShowRecord,
  fallbackBids?: Bid[],
): AuctionDetail => {
  const auction = (raw ?? {}) as AuctionDetail & { bids?: unknown };
  const bids: Bid[] = Array.isArray(auction.bids)
    ? (auction.bids as Bid[])
    : Array.isArray(fallbackBids)
      ? fallbackBids
      : [];

  return {
    ...auction,
    bids,
    current_price: normalizePrice(auction.current_price),
    status: statusFromApi(auction.status),
  };
};

export const getAuction = async (id: number) => {
  const res = await client.get<AuctionShowResponse>(`/auctions/${id}`);
  const data = res.data;

  const rawAuction =
    (data as { auction?: AuctionShowRecord }).auction ??
    (data as AuctionShowRecord);

  const fallbackBids = Array.isArray((data as { bids?: unknown }).bids)
    ? ((data as { bids: Bid[] }).bids as Bid[])
    : undefined;

  return normalizeAuctionDetail(rawAuction, fallbackBids);
};
