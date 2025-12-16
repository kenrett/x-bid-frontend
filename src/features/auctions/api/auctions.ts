import client from "@api/client";
import type { AuctionDetail, AuctionSummary } from "../types/auction";
import type { Bid } from "../types/bid";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import { statusFromApi } from "./status";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";

export type { AuctionDetail, AuctionSummary };

const normalizePrice = (value: unknown) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

export const getAuctions = async () => {
  const res = await client.get<
    ApiJsonResponse<"/api/v1/auctions", "get"> | { auctions?: unknown }
  >("/api/v1/auctions");

  const payload = res.data as
    | ApiJsonResponse<"/api/v1/auctions", "get">
    | { auctions?: unknown };

  let list: AuctionSummary[];
  if (Array.isArray(payload)) {
    list = payload;
  } else if (
    isRecord(payload) &&
    Array.isArray((payload as { auctions?: unknown }).auctions)
  ) {
    list = (payload as { auctions: AuctionSummary[] }).auctions;
  } else {
    throw reportUnexpectedResponse("getAuctions", payload);
  }

  if (
    list.some(
      (auction) => !Number.isFinite((auction as { id?: unknown }).id as number),
    )
  ) {
    throw reportUnexpectedResponse("getAuctions.items", payload);
  }

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
  const res = await client.get<AuctionShowResponse>(`/api/v1/auctions/${id}`);
  const data = res.data;

  const rawAuction =
    (data as { auction?: AuctionShowRecord }).auction ??
    (data as AuctionShowRecord);

  const hasFiniteId = (
    value: unknown,
  ): value is AuctionShowRecord & {
    id: number;
  } =>
    isRecord(value) &&
    Number.isFinite((value as { id?: unknown }).id as number) &&
    (value as { id?: unknown }).id !== undefined;

  if (!isRecord(rawAuction)) {
    throw reportUnexpectedResponse("getAuction", data);
  }

  if (!hasFiniteId(rawAuction)) {
    throw reportUnexpectedResponse("getAuction.id", data);
  }

  const fallbackBidsValue = isRecord(data)
    ? (data as { bids?: unknown }).bids
    : undefined;

  if (fallbackBidsValue !== undefined && !Array.isArray(fallbackBidsValue)) {
    throw reportUnexpectedResponse("getAuction.bids", data);
  }

  const fallbackBids = Array.isArray(fallbackBidsValue)
    ? (fallbackBidsValue as Bid[])
    : undefined;

  return normalizeAuctionDetail(rawAuction, fallbackBids);
};
